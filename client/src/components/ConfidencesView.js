import React from 'react';
import { AccountContext } from '../contexts/contexts'
import { fetchProtectedJSON } from '../utils'
import { Table, Tr, Td } from '../components/tables'

export default class ConfidencesView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      confidences: []
    }
    this.clickShowMore = this.clickShowMore.bind(this)
  }
  componentDidMount() {
    console.log('ConfidencesView.componentDidMount')
    this.getConfidences({count:30})
  }
  clickShowMore(e) {
    const confidences = this.state.confidences
    console.log('showmore')
    let before = null
    if (confidences.length > 0)
      before = confidences[confidences.length-1].timestamp
    this.getConfidences({before:before, count:30})
  }
  async getConfidences(args) {
    const account = this.context
    const accountId = account.accountId
    const uri = new URL(`/btctai/${accountId}/confidences`, location.origin)
    for (let prop in args)
      if (args[prop] === null) delete args[prop]
    uri.search = new URLSearchParams(args)
    console.log("Request confidences, uri:", uri)
    const opts = {
      method: "GET",
      enableRefreshToken: true
    }
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("confidences fetched:", json)
      this.setState({confidences: this.state.confidences.concat(json)})
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
                <Table>
                  <div className="siimple-table-header">
                    <Tr>
                      <Td>Date</Td>
                      <Td>Long</Td>
                      <Td>Short</Td>
                      <Td>Status</Td>
                    </Tr>
                  </div>
                  <div className="siimple-table-body">
                    {
                      state.confidences.map((c, i) => {
                        const date = new Date(c.timestamp * 1000)
                        return (
                          <Tr key={i}>
                            <Td>{date.toLocaleString()}</Td>
                            <Td>{Math.round(c.long * 100)} %</Td>
                            <Td>{Math.round(c.short * 100)} %</Td>
                            <Td>{c.status}</Td>
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
ConfidencesView.contextType = AccountContext;
