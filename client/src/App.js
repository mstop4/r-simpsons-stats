import React, { Component } from 'react';
import Chart from 'chart.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seasonCounts: [],
      showChart: false
    };

    this.myChart = null;
  }

  componentDidMount() {
    const seasonLabels = [];
    for (let i = 0; i < 30; i++) {
      seasonLabels[i] = (i+1).toString();
    }
 
    const ctx = document.getElementById('myChart');
    this.myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: seasonLabels,
        datasets: [{
          label: '# of submissions',
          data: [],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255,99,132,1)',
          borderWidth: 1
        }]
      },
      options: {
        maintainAspectRatio: false,
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
            seasonCounts: result.data,
            showChart: true
          });
        }
      });
  }

  componentDidUpdate() {
    this.myChart.data.datasets[0].data = this.state.seasonCounts;
    this.myChart.update();
  }

  render() {
    return (
      <div>
        {!this.state.showChart && <p>Fetching data...</p>}
        <canvas id="myChart" width="400" height="400"></canvas>
      </div>
    );
  }
}

export default App;