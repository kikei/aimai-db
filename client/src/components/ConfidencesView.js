import React from 'react';
import { AccountContext } from '../contexts/contexts'
import { fetchProtectedJSON } from '../utils'

export default class ConfidencesView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      confidences: []
    }
  }
  componentDidMount() {
    console.log('ConfidencesView.componentDidMount')
    this.getConfidences()
  }
  async getConfidences() {
    const account = this.context
    const accountId = account.accountId
    const uri = `/btctai/${accountId}/confidences`
    console.log("Request confidences, uri:", uri)
    const opts = {
      method: "GET",
      enableRefreshToken: true
    }
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("confidences fetched:", json)
      this.setState({confidences: json})
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
            console.log("ConfidencesView.render, account:", account,
                        "state:", state)
            return (
              <div className="siimple-content">
                <h2>Confidences</h2>
                <div className="siimple-table siimple-table--striped siimple-table--border">
                  <div className="siimple-table-header">
                    <div className="siimple-table-row">
                      <div className="siimple-table-cell">Date</div>
                      <div className="siimple-table-cell">Long</div>
                      <div className="siimple-table-cell">Short</div>
                      <div className="siimple-table-cell">Status</div>
                    </div>
                  </div>
                  <div className="siimple-table-body">
                    {
                      state.confidences.map((c, i) => {
                        const date = new Date(c.timestamp * 1000)
                        return (
                          <div key={i} className="siimple-table-row">
                            <div className="siimple-table-cell">
                              {date.toLocaleString()}
                            </div>
                            <div className="siimple-table-cell">
                              {Math.round(c.long * 100)} %
                            </div>
                            <div className="siimple-table-cell">
                              {Math.round(c.short * 100)} %
                            </div>
                            <div className="siimple-table-cell">
                              {c.status}
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
ConfidencesView.contextType = AccountContext;
