import React, { Component } from 'react';
import PropTypes from "prop-types";
import { BrowserRouter, Switch, Route, Link, Redirect } from 'react-router-dom';
import HomeView from './components/HomeView';
import LoginView from './components/LoginView';
import ValuesView from './components/ValuesView';
import TicksView from './components/TicksView';
import TradesView from './components/TradesView';
import PositionsView from './components/PositionsView.js';
import ConfidencesView from './components/ConfidencesView';
import TrendView from './components/TrendView';
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
        location.href = '/'
      else
        location.reload()
    } catch (error) {
      console.error("Failed to login:", error)
    }
  }
  logout(history) {
    localStorage.removeItem("access_token")
    history.push("/login")
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
    const Header = (props) => (
      <div className="siimple-jumbtron simmple-jumbotron--large">
        <div className="siimple-jumbotron-title">aimai dashboard</div>
      </div>
    )
    const pages = [
      { path: '/', name: 'Home' },
      { path: '/values', name: 'Values' },
      { path: '/exchangers', name: 'Exchangers' },
      { path: '/trades', name: 'Trades' },
      { path: '/confidences', name: 'Confidences' },
      { path: '/trends', name: 'Trends' },
      { path: '/positions', name: 'Positions' }
    ]
    const Navigation = (props) => (
      <nav className="siimple-navvar">
        <div className="siimple--float-right">
          <label className="siimple-label">Menu: </label>
          <select className="siimple-select"
                  onChange={e => {props.history.push(e.target.value)}}
                  defaultValue={location.pathname}>
            {
              pages.map((page, i) =>
                <option key={i} value={page.path}>{page.name}</option>
              )
            }
          </select>
          <div className="siimple-btn" onClick={(e) => location.reload()}>
            Reload
          </div>
          {this.isLoggedIn() ? (
            <div className="siimple-btn"
                 onClick={e => this.logout(props.history)}>
              Logout
            </div>
          ) : (
            <Link to="/login" className="siimple-navbar-item">Login</Link>
          )}
        </div>
      </nav>
    )
    const Home = (props) => (<div>Home</div>)
    const Main = (props) => (
      <BrowserRouter>
        <Route component={Header}/>
        <Route component={Navigation}/>
        <AccountContext.Provider value={state.account}>
          <Switch>
            <Route exact path="/" component={Home}/>
            <Route path="/login" component={LoginView}/>
            <Route path="/values" render={this.requireLogin(<ValuesView/>)}/>
            <Route path="/exchangers" render={this.requireLogin(<TicksView/>)}/>
            <Route path="/trades" render={this.requireLogin(<TradesView/>)}/>
            <Route path="/confidences"
                   render={this.requireLogin(<ConfidencesView/>)}/>
            <Route path="/trends" render={this.requireLogin(<TrendView/>)}/>
            <Route path="/positions"
                   render={this.requireLogin(<PositionsView/>)}/>
          </Switch>
        </AccountContext.Provider>
      </BrowserRouter>
    )
    return (
      <div>
        <div className="siimple-grid">
          <div className="siimple-grid-row">
            <div className="siimple-grid-col siimple-grid-col--2 siimple-grid-col--md-1 siimple-grid-col--sm-12"></div>
            <div className="siimple-grid-col siimple-grid-col--8 siimple-grid-col--md-10 siimple-grid-col--sm-12">
              <Main/>
            </div>
            <div className="siimple-grid-col siimple-grid-col--2 siimple-grid-col--md-1 siimple-grid-col--sm-12"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
