import React from 'react';
import { AccountContext } from '../contexts/contexts'

export default class LoginView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      inputUsername: "",
      inputPassowrd: ""
    }
    this.submitLogin = this.submitLogin.bind(this)
    this.changeInputUsername = this.changeInputUsername.bind(this)
    this.changeInputPassword = this.changeInputPassword.bind(this)
  }
  submitLogin(e) {
    console.log('LoginView.submitLogin', this.context)
    e.preventDefault();
    const state = this.state
    console.log('username', state.inputUsername, this.context)
    this.context.requestLogin(state.inputUsername, state.inputPassword)
  }
  changeInputUsername(e) {
    this.setState({inputUsername: e.target.value})
  }
  changeInputPassword(e) {
    this.setState({inputPassword: e.target.value})
  }
  render() {
    const state = this.state
    return (
      <AccountContext.Consumer>
        {
          (account) => {
            console.log('LoginView.render', account)
            return (
              <div className="siimple-content">
                <h2>Login</h2>
                <form action="?" method="POST" autoComplete="on"
                      onSubmit={this.submitLogin}
                      className="siimple-form">
                  <div className="siimple-form-field">
                    <label htmlFor="username"
                           className="siimple-form-field-label">
                      Username:
                    </label>
                    <input name="username" type="text" size="10"
                           placeholder="Your name"
                           className="siimple-input"
                           value={state.inputUsername||""}
                           autoComplete="current-password"
                           onChange={this.changeInputUsername}/>
                  </div>
                  <div className="siimple-form-field">
                    <label htmlFor="password"
                           className="siimple-form-field-label">
                      Password:
                    </label>
                    <input name="password" type="password" size="20"
                           className="siimple-input"
                           value={state.inputPassword||""}
                           autoComplete="current-password"
                           onChange={this.changeInputPassword}/>
                  </div>
                  <div className="siimple-form-field">
                    <input type="submit" type="submit" value="Login"
                           className="siimple-btn" />
                  </div>
                </form>
              </div>
            )
          }
        }
      </AccountContext.Consumer>
    )      
  }
}
LoginView.contextType = AccountContext;
