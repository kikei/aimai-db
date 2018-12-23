import React from 'react';
import update from 'immutability-helper';
import { AccountContext } from '../contexts/contexts'
import { fetchProtectedJSON, groupBy, jpy } from '../utils'
import { Table, Tr, Td } from '../components/tables'

const sum = (xs) => xs.reduce((i,a) => i + a, 0)
const sumProduct = (xss) =>
      sum(xss[0].map((_, i) => xss.reduce((a, xs) => a * xs[i], 1)))

export default class PositionsView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      positions: [],
      board: {
        datetime: null,
        ask: null,
        bid: null
      },
      editStatus: {
        index: null,
        status: null
      }
    }
    this.clickStatus = this.clickStatus.bind(this)
    this.changeStatus = this.changeStatus.bind(this)
    this.clickShowMore = this.clickShowMore.bind(this)
  }
  componentDidMount() {
    console.log('PositionsView.componentDidMount')
    this.getPositions({count: 30})
    this.getTick({exchangers: ['bitflyer'], limit: 1})
  }
  clickStatus(i, e) {
    console.log("PositionsView.clickStatus, i:", i, "e:", e)
    const positions = this.state.positions
    const position = positions[i]
    this.setState({editStatus: {
      index: i,
      status: position.state
    }})
  }
  changeStatus(e) {
    console.log("PositionsView.changeStatus, e.target.value:", e.target.value)
    const i = this.state.editStatus.index
    this.updatePosition(i, {status: e.target.value})
  }
  clickShowMore(e) {
    const positions = this.state.positions
    let before = null
    if (positions.length > 0)
      before = positions[positions.length-1].timestamp
    this.getPositions({before:before, count:30})
  }
  async getPositions(args) {
    const account = this.context
    const accountId = account.accountId
    const uri = new URL(`/btctai/${accountId}/positions`, location.origin)
    for (let prop in args)
      if (args[prop] === null) delete args[prop]
    uri.search = new URLSearchParams(args)
    console.log("Request values, uri:", uri)
    const opts = {
      method: "GET",
      enableRefreshToken: true
    }
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("Positions fetched:", json)
      this.setState({positions: this.state.positions.concat(json)})
    } catch (error) {
      console.error("Failed to get positions:", error)
      return
    }
  }
  async updatePosition(i, data) {
    const account = this.context
    const accountId = account.accountId
    const positions = this.state.positions
    const position = positions[i]
    const timestamp = position.timestamp
    const uri = new URL(`/btctai/${accountId}/positions/${timestamp}`,
                        location.origin)
    console.log("Request update position, uri:", uri)
    const opts = {
      method: "POST",
      body: JSON.stringify(data),
      enableRefreshToken: true
    }
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("Positions fetched:", json)
      this.setState({
        positions: update(positions, {[i]: {$set: json}}),
        editStatus: {index: null, status: null}
      })
    } catch (error) {
      console.error("Failed to update positions:", error)
      return
    }
  }
  async getTick(args) {
    const account = this.context
    const exchanger = args.exchangers[0]
    const uri = new URL('/ticks', location.origin)
    uri.search = new URLSearchParams(args)
    console.log("Request values, uri:", uri)
    const opts = {
      method: "GET"
    }
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("Ticks fetched:", json)
      const ticks = json.ticks[exchanger]
      if (ticks.length > 0) {
        const {date, ask, bid} = ticks[0]
        this.setState({board: {date: date, ask: ask, bid: bid}})
      }
    } catch (error) {
      console.error("Failed to get ticks:", error)
      return
    }
  }

  render() {
    const state = this.state
    return (
      <AccountContext.Consumer>
        {
          (account) => {
            console.log("PositionsView.render, account:", account,
                        "state:", state)
            return (
              <div className="siimple-content">
                <h2>Positions</h2>
                <Table>
                  <div className="siimple-table-header">
                    <Tr>
                      <Td>Date</Td>
                      <Td>Status</Td>
                      <Td>Size</Td>
                      <Td>Price</Td>
                      <Td>Side</Td>
                      <Td>Variate</Td>
                      <Td>Profit</Td>
                    </Tr>
                  </div>
                  <div className="siimple-table-body">
                    {
                      state.positions.map((v, i) => {
                        const date = new Date(v.timestamp * 1000)
                        const status = v.status
                        // Now support only single position
                        const p = v.positions[0]
                        const side = p.side
                        const amount = sumProduct([p.prices, p.sizes])
                        const size = sum(p.sizes)
                        const price = amount / size
                        const {ask, bid} = state.board
                        const currentPrice = side == 'LONG' ? bid : ask
                        const variated = currentPrice / (price || -1)
                        const profit = side == 'LONG' ? bid - price : price - ask
                        const Status = () =>
                          state.editStatus.index == i ? (
                            <select
                              className="siimple-select siimple-select--fluid"
                              defaultValue={status} onChange={this.changeStatus}>
                              {['open', 'close', 'ignored'].map((s, j) => 
                                <option key={j} value={s}>{s}</option>
                              )}
                            </select>
                          ) : (
                            <a className="siimple-link"
                               onClick={this.clickStatus.bind(this, i)}>
                              {status}
                            </a>
                          )
                        return (
                          <Tr key={i}>
                            <Td>{date.toLocaleString()}</Td>
                            <Td><Status/></Td>
                            <Td>{size.toFixed(3)}</Td>
                            <Td>{jpy(price)}</Td>
                            <Td>{side}</Td>
                            <Td>
                              {status == 'open' ?
                                 (100 * variated).toFixed(4) + '%': '-'}
                            </Td>
                            <Td>
                              {status == 'open' ? jpy(profit * size) : '-'}
                            </Td>
                          </Tr>
                        )
                      })
                    }
                  </div>
                </Table>
                <div className="siimple-btn siimple-btn--primary siimple-btn--fluid"
                     onClick={this.clickShowMore}>
                  Show more
                </div>
              </div>
            )
          }
        }
      </AccountContext.Consumer>
    )
  }
}
PositionsView.contextType = AccountContext;
