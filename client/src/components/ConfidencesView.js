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
              </div>
            )
          }
        }
      </AccountContext.Consumer>
    )      
  }
}
ConfidencesView.contextType = AccountContext;
