import React, { Component } from 'react';
import Chart from 'chart.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seasonCounts: []
    };
  }

  componentDidMount() {
    const ctx = document.getElementById('myChart');
    const myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
          label: '# of Votes',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
            'rgba(255,99,132,1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });

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
      <canvas id="myChart" width="400" height="400"></canvas>
      // <div className="App">
      //   {this.state.seasonCounts.map((season, i) => (<p key={i}>Season {i+1}: {season}</p>))}
      // </div>
    );
  }
}

export default App;