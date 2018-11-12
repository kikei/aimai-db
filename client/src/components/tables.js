import React from 'react';

export class Table extends React.Component {
  render() {
    return (
      <div className="siimple-table siimple-table--striped siimple-table--border">
        {this.props.children}
      </div>
    )
  }
}

export class Tr extends React.Component {
  render() {
    return (
      <div className="siimple-table-row">
        {this.props.children}
      </div>
    )
  }
}

export class Td extends React.Component {
  render() {
    return (
      <div className="siimple-table-cell">
        {this.props.children}
      </div>
    )
  }
}
