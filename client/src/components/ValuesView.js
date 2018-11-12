import React from 'react';
import { AccountContext } from '../contexts/contexts'
import { fetchProtectedJSON } from '../utils'
import { Table, Tr, Td } from '../components/tables'

function parseOfType(type, value) {
  switch (type) {
  case "float":
    return parseFloat(value)
  case "int":
    return parseFloat(value)
  case "boolean":
    return value != "false"
  case "string":
  default:
    return value
  }
}

class ValueRow extends React.Component {
  constructor(props) {
    console.log("constructor, props:", props)
    super(props)
    this.state = {
      inputValue: props.value,
      edit: false
    }
    this.changeInputValue = this.changeInputValue.bind(this)
    this.clickEdit = this.clickEdit.bind(this)
    this.clickSubmit = this.clickSubmit.bind(this)
    this.clickCancel = this.clickCancel.bind(this)
  }
  changeInputValue(e) {
    this.setState({inputValue: e.target.value})
  }
  clickEdit(key, e) {
    console.log('clickEdit, key:', key, e)
    this.setState({edit: true, inputValue: this.props.value||""})
  }
  clickSubmit(e) {
    const {props, state} = this
    console.log("ValuesView.clickSubmit, inputValue:", state.inputValue,
                "type:", props.type)
    if (props.onSubmit) {
      const value = parseOfType(props.type, state.inputValue)
      props.onSubmit(props.keyName, value)
      this.setState({edit: false, inputValue: null})
    }
  }
  clickCancel(e) {
    const {props, state} = this
    console.log("ValuesView.clickCancel, inputValue:", state.inputValue)
    this.setState({edit: false, inputValue: null})
  }
  render() {
    const state = this.state
    const props = this.props
    if (!state.edit) {
      return (
        <Tr>
          <Td>{props.keyName}</Td>
          <Td>{props.type}</Td>
          <Td>{props.value !== null && String(props.value)}</Td>
          <Td>
            <button className="siimple-btn siimple-btn--teal"
                    onClick={this.clickEdit.bind(this, props.keyName)}>
              Edit
            </button>
          </Td>
        </Tr>
      )
    } else {
      return (
        <Tr>
          <Td>{props.keyName}</Td>
          <Td>{props.type}</Td>
          <Td>
            <input type="text" className="siimple-input siimple-input--fluid"
                   value={state.inputValue}
                   onChange={this.changeInputValue}/>
          </Td>
          <Td>
            <button className="siimple-btn siimple-btn--primary"
                    onClick={this.clickSubmit}>
              Submit
            </button>
            <button className="siimple-btn siimple-btn--gray"
                    onClick={this.clickCancel}>
              Cancel
            </button>
          </Td>
        </Tr>
      )
    }
  }
}
    

export default class ValuesView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      values: {},
      edit: null
    }
    this.getValues = this.getValues.bind(this)
    this.postValue = this.postValue.bind(this)
    this.submitValue = this.submitValue.bind(this)
  }
  componentDidMount() {
    console.log('ValuesView.componentDidMount')
    this.getValues()
  }
  async getValues() {
    const account = this.context
    const accountId = account.accountId
    const uri = `/btctai/${accountId}/values`
    console.log("Request values, uri:", uri)
    const opts = {
      method: "GET",
      enableRefreshToken: true
    }
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("Values fetched:", json)
      this.setState({values: json})
    } catch (error) {
      console.error("Failed to get values:", error)
      return
    }
  }
  async postValue(key, value) {
    const account = this.context
    const accountId = account.accountId
    const uri = `/btctai/${accountId}/values/${key}`
    const opts = {
      method: "POST",
      body: JSON.stringify({value: value}),
      enableRefreshToken: true
    }
    console.log("Request values, uri:", uri, "opts:", opts)
    try {
      const {response, json} = await fetchProtectedJSON(account, uri, opts)
      console.log("Values fetched:", json)
      const values = Object.assign(this.state.values, json)
      this.setState({edit: false,
                     values: values,
                     inputValue: null})
    } catch (error) {
      console.error("Failed to get values:", error)
      return
    }
  }
  submitValue(key, value) {
    console.log("submitValue, key:", key, "value:", value)
    this.postValue(key, value)
  }
  render() {
    const state = this.state
    return (
      <AccountContext.Consumer>
        {
          (account) => {
            console.log("ValuesView.render, account:", account,
                        "state:", state)
            return (
              <div className="siimple-content">
                <h2>Values</h2>
                <Table>
                  <div className="siimple-table-header">
                    <Tr>
                      <Td>Name</Td>
                      <Td>Type</Td>
                      <Td>Value</Td>
                      <Td>Action</Td>
                    </Tr>
                  </div>
                  <div className="siimple-table-body">
                    {
                      Object.keys(state.values).map((k, i) => {
                        const [v, ty] = state.values[k]
                        return (
                            <ValueRow key={k} keyName={k} value={v} type={ty}
                                      onSubmit={this.submitValue}/>
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
ValuesView.contextType = AccountContext;
