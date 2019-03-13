import React, { Component } from 'react';
import Chart from 'chart.js';
import SeasonDetails from './SeasonDetails';
import '../App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seasonData: [],
      completeData: [],
      chartData: [],
      showChart: false,
      seasonDetails: true,
      seasonNum: 1
    };

    this.myChart = null;
  }

  toggleSeasonDetails = (event) => {
    let newChartData;

    if (event.target.checked) {
      newChartData = this.state.completeData[this.state.seasonNum-1];
    }

    else {
      newChartData = this.state.completeData.map(season => {
        return season.reduce((sum, num) => sum + num);
      });
    }

    this.setState({
      chartData: newChartData,
      seasonDetails: event.target.checked
    });
  }

  componentDidMount = () => {
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

    fetch('/seasons')
      .then(res => res.json())
      .then(seasonData => {

        if (seasonData.status === 'ok') {
          fetch('/submissions?season=0&seasonstats=true')
            .then(res => res.json())
            .then(chartData => {
              
              if (chartData.status === 'ok') {
                let newChartData;

                if (this.state.seasonDetails) {
                  newChartData = chartData.data[this.state.seasonNum-1];
                }

                else {
                  newChartData = chartData.data.map(season => {
                    return season.reduce((sum, num) => sum + num);
                  });
                }

                this.setState({
                  seasonData: seasonData.data,
                  completeData: chartData.data,
                  chartData: newChartData,
                  showChart: true
                });
              }
            });
        }
      });
  }

  componentDidUpdate = () => {
    this.myChart.data.datasets[0].data = this.state.chartData;
    const numLabels = this.state.seasonDetails ? this.state.seasonData[this.state.seasonNum-1].numEpisodes : this.state.seasonData.length;

    const newSeasonLabels = [];
    for (let i = 0; i < numLabels; i++) {
      newSeasonLabels[i] = (i+1).toString();
    }

    this.myChart.data.labels = newSeasonLabels;
    this.myChart.update();
  }

  render = () => {
    const chartClass = !this.state.showChart ? 'chart--hidden' : '';

    return (
      <div>
        {!this.state.showChart && <p>Fetching data...</p>}
        <div id="chartWrapper" className={chartClass}>
          <canvas id="myChart" width="400" height="400"></canvas>
        </div>
        <SeasonDetails checked={this.state.seasonDetails} handleChange={this.toggleSeasonDetails}/>
      </div>
    );
  }
}

export default App;