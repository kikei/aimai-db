import React from 'react';
import { AccountContext } from '../contexts/contexts'
import { fetchProtectedJSON } from '../utils'
import { Table, Tr, Td } from '../components/tables'

export default class TrendView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      strength: []
    }
    this.clickShowMore = this.clickShowMore.bind(this)
  }
  componentDidMount() {
    console.log('TrendView.componentDidMount')
    this.getStrength({count:30})
  }
  clickShowMore(e) {
    const strength = this.state.strength
    let before = null
    if (strength.length > 0)
      before = strength[strength.length-1].timestamp
    this.getStrength({before:before, count:30})
  }
  async getStrength(args) {
    const account = this.context
    const accountId = account.accountId
    const uri = new URL(`/btctai/${accountId}/trendStrength`, location.origin)
    for (let prop in args)
      if (args[prop] === null) delete args[prop]
    uri.search = new URLSearchParams(args)
    console.log("Request trend strength, uri:", uri)
    const opts = {
      method: "GET",
      enableRefreshToken: true
    }
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("trend strength fetched:", json)
      this.setState({strength: this.state.strength.concat(json)})
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
            console.log("TrendView.render, account:", account,
                        "state:", state)
            return (
              <div className="siimple-content">
                <h2>Trend</h2>
                <Table>
                  <div className="siimple-table-header">
                    <Tr>
                      <Td>Date</Td>
                      <Td>Strength</Td>
                      <Td>Trend</Td>
                    </Tr>
                  </div>
                  <div className="siimple-table-body">
                    {
                      state.strength.map((c, i) => {
                        const date = new Date(c.timestamp * 1000)
                        return (
                          <Tr key={i}>
                            <Td>{date.toLocaleString()}</Td>
                            <Td>{c.strength.toFixed(3)}</Td>
                            <Td>{c.strength > 0.6 ? 'Up' :
                                 c.strength >= 0.4 ? 'Flat' : 'Down'}</Td>
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
TrendView.contextType = AccountContext;
