import React from 'react';
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
        ask: 740000,
        bid: 739887
      }
    }
    this.clickShowMore = this.clickShowMore.bind(this)
  }
  componentDidMount() {
    console.log('PositionsView.componentDidMount')
    this.getPositions({count: 30})
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
                      <Td>Amount</Td>
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
                        const variated = currentPrice / price
                        const profit = side == 'LONG' ? bid - price : price - ask
                        return (
                          <Tr key={i}>
                            <Td>{date.toLocaleString()}</Td>
                            <Td>{status}</Td>
                            <Td>{size.toFixed(3)}</Td>
                            <Td>{jpy(price)}</Td>
                            <Td>{jpy(amount)}</Td>
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
