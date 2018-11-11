import React, { Component } from 'react';
import PropTypes from "prop-types";
import { Switch, Route, Link, Redirect } from 'react-router-dom';
import HomeView from './components/HomeView';
import LoginView from './components/LoginView';
import ValuesView from './components/ValuesView';
import TradesView from './components/TradesView';
import ConfidencesView from './components/ConfidencesView';
import { AccountContext } from './contexts/contexts';
import { fetchJSON, fetchProtectedJSON } from './utils'

class App extends Component {
  static contextTypes = {
    router: PropTypes.object
  }
  constructor(props, context) {
    super(props, context)
    this.state = {
      account: {
        accountId: null,
        username: null,
        requestLogin: this.requestLogin.bind(this),
        requestRefresh: this.requestRefresh.bind(this)
      },
      setting: {
        mode: 'simple',
        changeMode: this.changeMode.bind(this),
        isSimpleMode: () => this.state.setting.mode === 'simple'
      }
    }
    this.state.account = Object.assign(this.state.account, this.loadAccount())
    this.isLoggedIn = this.isLoggedIn.bind(this)
    this.requireLogin = this.requireLogin.bind(this)
    this.requestRefresh = this.requestRefresh.bind(this)
    this.logout = this.logout.bind(this)
  }
  loadAccount() {
    const accessToken = window.localStorage.getItem("access_token")
    const refreshToken = window.localStorage.getItem("refresh_token")
    console.log("Token loaded, accessToken:", accessToken,
                "refreshToken:", refreshToken);
    if (!accessToken) return {}
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      if (!payload['identity']) return {}
      return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        accountId: payload['identity'],
        username: payload['user_claims']['username']
      }
    } catch (error) {
      return {}
    }
  }
  changeMode(e) {
    const setting = Object.assign(this.state.setting, {mode: e.target.value})
    this.setState({setting: setting})
  }
  async requestRefresh(refreshToken) {
    const opts = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    }
    try {
      const {response, json} =
            await fetchJSON("/refresh", opts)
      console.log("requestRefresh, json:", json)
      const accessToken = json.access_token
      window.localStorage.setItem("access_token", accessToken)
      this.setState({account: Object.assign(this.state.account, {
        accessToken: accessToken
      })})
      return Promise.resolve({response: response, accessToken: accessToken})
    } catch (error) {
      console.error("Failed to refresh token, error:", error)
      return Promise.reject(error)
    }
  }
  async requestLogin(username, password) {
    const opts = {
      method: "POST",
      body: JSON.stringify({
        username: username,
        password: password
      })
    }
    try {
      const {response, json} =
            await fetchJSON("/login", opts)
      console.log("requestLogin, json:", json)
      const accessToken = json.access_token
      const refreshToken = json.refresh_token
      window.localStorage.setItem("access_token", accessToken)
      window.localStorage.setItem("refresh_token", refreshToken)
      const payload = JSON.parse(atob(accessToken.split(".")[1]))
      console.log("payload", payload)
      if (payload.identity) {
        this.setState({account: Object.assign(this.state.account, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          accountId: payload.identity,
          username: payload.user_claims.username
        })})
      }
      console.log("authenticated, state:", this.state,
                  "location:", location.pathname)
      if (location.pathname === '/login')
        this.context.router.history.push("/")
      else
        location.reload()
    } catch (error) {
      console.error("Failed to login:", error)
    }
  }
  logout() {
    localStorage.removeItem("access_token")
    this.context.router.history.push("/login")
    console.log("logged out", localStorage.getItem("access_token"))
    location.reload()
  }
  isLoggedIn() {
    return this.state.account['username'] != null
  }
  requireLogin(component) {
    return (props) =>
      this.isLoggedIn() ?
      component:
      <LoginView/>
  }
  render() {
    const state = this.state
    const Header = (
      <div className="siimple-jumbtron simmple-jumbotron--large">
        <div className="siimple-jumbotron-title">aimai dashboard</div>
      </div>
    )
    const Navigation = (
      <nav className="siimple-navvar">
        <div className="siimple--float-right">
          <Link to="/" className="siimple-navbar-item">Home</Link>
          <Link to="/values" className="siimple-navbar-item">Values</Link>
          <Link to="/trades" className="siimple-navbar-item">Trades</Link>
          <Link to="/confidences" className="siimple-navbar-item">Confidences</Link>
          {this.isLoggedIn() ? (
            <a className="siimple-navbar-item" onClick={this.logout}>
            Logout
          </a>
          ) : (
              <Link to="/login" className="siimple-navbar-item">Login</Link>
          )}
        </div>
      </nav>
    )
    const Body = (
      <AccountContext.Provider value={state.account}>
        <Switch>
          <Route exact path="/" component={Home}/>
          <Route path="/login" component={LoginView}/>
          <Route path="/values" render={this.requireLogin(<ValuesView/>)}/> 
          <Route path="/trades" render={this.requireLogin(<TradesView/>)}/> 
          <Route path="/Confidences" render={this.requireLogin(<ConfidencesView/>)}/> 
        </Switch>
      </AccountContext.Provider>
    )
    const Home = () => (<div>Home</div>)
    return (
      <div>
        <div className="siimple-grid">
          <div className="siimple-grid-row">
            <div className="siimple-grid-col siimple-grid-col--2"></div>
            <div className="siimple-grid-col siimple-grid-col--8">
              {Header}
              {Navigation}
              {Body}
            </div>
            <div className="siimple-grid-col siimple-grid-col--2"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
