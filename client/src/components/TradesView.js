import React from 'react';
import { AccountContext } from '../contexts/contexts'
import { fetchProtectedJSON } from '../utils'
import { Table, Tr, Td } from '../components/tables'

const sum = (xs) => xs.reduce((i,a) => i + a, 0)
const sumProduct = (xss) =>
      sum(xss[0].map((_, i) => xss.reduce((a, xs) => a * xs[i], 1)))

export default class TradesView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      trades: []
    }
    this.clickShowMore = this.clickShowMore.bind(this)
  }
  componentDidMount() {
    console.log('TradesView.componentDidMount')
    this.getTrades({count: 30})
  }
  clickShowMore(e) {
    const trades = this.state.trades
    let before = null
    if (trades.length > 0)
      before = trades[trades.length-1].timestamp
    this.getTrades({before:before, count:30})
  }
  async getTrades(args) {
    const account = this.context
    const accountId = account.accountId
    const uri = new URL(`/btctai/${accountId}/trades`, location.origin)
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
      console.log("Values fetched:", json)
      this.setState({trades: this.state.trades.concat(json)})
    } catch (error) {
      console.error("Failed to get values:", error)
      return
    }
  }
  render() {
    const state = this.state
    return (
      <AccountContext.Consumer>
        {
          (account) => {
            console.log("TradesView.render, account:", account,
                        "state:", state)
            return (
              <div className="siimple-content">
                <h2>Trades</h2>
                <Table>
                  <div className="siimple-table-header">
                    <Tr>
                      <Td>Date</Td>
                      <Td>Side</Td>
                      <Td>Size</Td>
                      <Td>Price</Td>
                      <Td>Amount</Td>
                    </Tr>
                  </div>
                  <div className="siimple-table-body">
                    {
                      state.trades.map((v, i) => {
                        const p = v.position
                        const date = new Date(v.timestamp * 1000)
                        const side = p.side
                        const amount = sumProduct([p.prices, p.sizes])
                        const size = sum(p.sizes)
                        const price = amount / size
                        return (
                          <Tr key={i}>
                            <Td>{date.toLocaleString()}</Td>
                            <Td>{side}</Td>
                            <Td>{size.toFixed(3)}</Td>
                            <Td>{price.toFixed(0)}</Td>
                            <Td>{amount.toFixed(0)}</Td>
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
TradesView.contextType = AccountContext;
