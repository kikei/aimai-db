import React from 'react';
import { AccountContext } from '../contexts/contexts'
import { fetchProtectedJSON } from '../utils'

const sum = (xs) => xs.reduce((i,a) => i + a, 0)
const sumProduct = (xss) =>
      sum(xss[0].map((_, i) => xss.reduce((a, xs) => a * xs[i], 1)))

export default class TradesView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      trades: []
    }
  }
  componentDidMount() {
    console.log('TradesView.componentDidMount')
    this.getTrades()
  }
  async getTrades() {
    const account = this.context
    const accountId = account.accountId
    const uri = `/btctai/${accountId}/trades`
    console.log("Request values, uri:", uri)
    const opts = {
      method: "GET",
      enableRefreshToken: true
    }
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("Values fetched:", json)
      this.setState({trades: json})
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
                <div className="siimple-table siimple-table--striped siimple-table--border">
                  <div className="siimple-table-header">
                    <div className="siimple-table-row">
                      <div className="siimple-table-cell">Date</div>
                      <div className="siimple-table-cell">Side</div>
                      <div className="siimple-table-cell">Size</div>
                      <div className="siimple-table-cell">Price</div>
                      <div className="siimple-table-cell">Amount</div>
                    </div>
                  </div>
                  <div className="siimple-table-body">
                    {
                      state.trades.map((v, i) => {
                        const p = v.position
                        const date = new Date(v.timestamp * 1000)
                        const side = p.side
                        const price = sum(p.prices)
                        const size = sum(p.sizes)
                        const amount = sumProduct([p.prices, p.sizes])
                        return (
                          <div key={i} className="siimple-table-row">
                            <div className="siimple-table-cell">
                              {date.toLocaleString()}
                            </div>
                            <div className="siimple-table-cell">{side}</div>
                            <div className="siimple-table-cell">
                              {size.toFixed(3)}
                            </div>
                            <div className="siimple-table-cell">
                              {price.toFixed(0)}
                            </div>
                            <div className="siimple-table-cell">
                              {amount.toFixed(0)}
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
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
