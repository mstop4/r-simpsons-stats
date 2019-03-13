import React, { Component } from 'react';
import Chart from 'chart.js';
import SeasonDetails from './SeasonDetails';
import SeasonSelector from './SeasonSelector';
import '../App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seasonData: [],
      completeData: [],
      chartData: [],
      showChart: false,
      seasonDetails: false,
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

  handleSeasonSelection = (event) => {
    const num = parseInt(event.target.value);

    if (this.state.seasonDetails) {
      const newChartData = this.state.completeData[num-1];

      this.setState({
        chartData: newChartData,
        seasonNum: num
      });
    }

    else {
      this.setState({
        seasonNum: num
      });
    }
  }

  chartClick = (event, elems) => {
    if (!this.state.seasonDetails) {
      let seasonClicked = null;

      ///console.log(this.myChart.scales['x-axis-0']);

      if (elems && elems.length > 0) {
        seasonClicked = elems[0]._index;
      }

      else {
        const mousePoint = Chart.helpers.getRelativePosition(event, this.myChart.chart);

        if (mousePoint.y >= this.myChart.scales['x-axis-0'].top) {
          seasonClicked = this.myChart.scales['x-axis-0'].getValueForPixel(mousePoint.x);
        }

        else {
          seasonClicked = null;
        }
      }
      
      if (seasonClicked !== null) {
        const newChartData = this.state.completeData[seasonClicked];

        this.setState({
          chartData: newChartData,
          seasonNum: seasonClicked+1,
          seasonDetails: true
        });
      }
    }
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
        onClick: this.chartClick,
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
        <SeasonDetails 
          checked={this.state.seasonDetails}
          handleChange={this.toggleSeasonDetails}
        />
        <SeasonSelector
          maxSeason={this.state.seasonData.length}
          curSeason={this.state.seasonNum}
          handleChange={this.handleSeasonSelection}
        />
      </div>
    );
  }
}

export default App;