import React, { Component } from 'react';
import Chart from 'chart.js';
import ChartHeader from './ChartHeader';
import SeasonDetails from './SeasonDetails';
import SeasonSelector from './SeasonSelector';
import '../styles/BarChart.css';

class BarChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seasonData: [],
      completeData: [],
      chartData: [],
      chartTotal: 0,
      showChart: false,
      seasonDetails: false,
      seasonNum: 1,
      lastUpdated: 0
    };

    this.myChart = null;
  }

  updateChartData = (detailView, dataset, seasonNum) => {
    let newChartData;

    if (detailView) {
      newChartData = dataset[seasonNum];
    }

    else {
      newChartData = dataset.map(season => {
        return season.reduce((sum, num) => sum + num);
      });
    }

    const chartTotal = newChartData.reduce((sum, num) => sum + num);

    return {
      chartData: newChartData,
      chartTotal: chartTotal
    };
  }

  toggleSeasonDetails = (event) => {
    const newData = this.updateChartData(event.target.checked, this.state.completeData, this.state.seasonNum);

    this.setState({
      chartData: newData.chartData,
      chartTotal: newData.chartTotal,
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
        const newData = this.updateChartData(true, this.state.completeData, seasonClicked);

        this.setState({
          chartData: newData.chartData,
          chartTotal: newData.chartTotal,
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
        },
        tooltips: {
          callbacks: {
            title: (tooltipItem, data) => {
              if (this.state.seasonDetails) {
                return `Season ${this.state.seasonNum}\nEpisode ${data['labels'][tooltipItem[0].index]}`;
              }
              else {
                return `Season ${data['labels'][tooltipItem[0].index]}`;
              }
            },
            label: (tooltipItem, data) => {
              return `${data.datasets[0].data[tooltipItem.index]} submissions`;
            }
          },
          backgroundColor: '#DDD',
          titleFontSize: 16,
          titleFontColor: '#0066ff',
          bodyFontColor: '#000',
          bodyFontSize: 14,
          displayColors: false
        }
      }
    });

    fetch('/seasons')
      .then(res => res.json())
      .then(seasonData => {

        if (seasonData.status === 'ok') {
          fetch('/submissions?season=0&seasonstats=true')
            .then(res => res.json())
            .then(seasonStats => {
        
              if (seasonStats.status === 'ok') {
                const newData = this.updateChartData(this.state.seasonDetails, seasonStats.data, 0);

                this.setState({
                  seasonData: seasonData.data,
                  completeData: seasonStats.data,
                  chartData: newData.chartData,
                  chartTotal: newData.chartTotal,
                  showChart: true,
                  lastUpdated: seasonStats.lastUpdated
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
    const dateString = new Date(this.state.lastUpdated * 1000).toLocaleString();

    return (
      <div>
        <ChartHeader show={this.state.showChart} dateString={dateString} chartTotal={this.state.chartTotal}/>
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

export default BarChart;