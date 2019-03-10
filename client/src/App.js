import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seasonCounts: []
    };
  }

  componentDidMount() {
    fetch('/submissions?season=0&seasonstats=true')
      .then(res => res.json())
      .then(result => {
        if (result.status === 'ok') {
          this.setState({
            seasonCounts: result.data
          });
        }
      });
  }

  render() {
    return (
      <div className="App">
        {this.state.seasonCounts.map((season, i) => (<p key={i}>Season {i+1}: {season}</p>))}
      </div>
    );
  }
}

export default App;