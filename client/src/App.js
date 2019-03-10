import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seasonCount: []
    };
  }

  componentDidMount() {
    fetch('/submissions?season=2')
      .then(res => res.json())
      .then(result => {
        if (result.status === 'ok') {
          this.setState({
            seasonCount: result.data.length
          });
        }
      });
  }

  render() {
    return (
      <div className="App">
        <p>Season 2: {this.state.seasonCount}</p>
      </div>
    );
  }
}

export default App;