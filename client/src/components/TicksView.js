import React from 'react';
import { AccountContext } from '../contexts/contexts'
import { fetchProtectedJSON, jpy } from '../utils'
import { Table, Tr, Td } from '../components/tables'

export default class TicksView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ticks: {}
    }
    this.getTicks = this.getTicks.bind(this)
  }
  componentDidMount() {
    console.log('ValuesView.componentDidMount')
    this.getTicks()
  }
  async getTicks() {
    const account = this.context
    const accountId = account.accountId
    const uri = `/ticks?limit=1`
    console.log("Request ticks, uri:", uri)
    const opts = {
      method: "GET",
      enableRefreshToken: true
    }
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("Ticks fetched:", json)
      this.setState({ticks: json.ticks})
    } catch (error) {
      console.error("Failed to get ticks:", error)
    }
  }
  render() {
    const state = this.state
    return (
      <AccountContext.Consumer>
        {
          (account) => {
            console.log("TicksView.render, account:", account, "state:", state)
            return (
              <div className="siimple-content">
                <h2>Ticks</h2>
                <Table>
                  <div className="siimple-table-header">
                    <Tr>
                      <Td>Exchanger</Td>
                      <Td>ASK</Td>
                      <Td>BID</Td>
                      <Td>Date</Td>
                    </Tr>
                  </div>
                  <div className="siimple-table-body">
                    {
                      Object.keys(state.ticks).map((exchanger, i) => {
                        const {datetime=0, ask=0, bid=0} =
                              state.ticks[exchanger][0]
                        const date = new Date(datetime * 1000)
                        return (
                          <Tr key={i}>
                            <Td>{exchanger}</Td>
                            <Td>{ask.toPrecision(6)}</Td>
                            <Td>{bid.toPrecision(6)}</Td>
                            <Td>{date.toLocaleString()}</Td>
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
TicksView.contextType = AccountContext;
