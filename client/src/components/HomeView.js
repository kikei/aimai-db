import React from 'react';
import { AccountContext } from '../contexts/contexts'

export default class HomeView extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    const state = this.state
    return (
      <div>HomeView</div>
      // <AccountContext.Consumer>
      //   {
      //     (account) => {
      //       return (
      //         <React.Fragments>
      //           <div>HomeView</div>
      //         </React.Fragments>
      //       )
      //     }
      //   }
      // </AccountContext.Consumer>
    )      
  }
}
