import React, { Component } from 'react';
import Chart from 'chart.js';
import ChartHeader from './ChartHeader';
import SeasonDetails from './SeasonDetails';
import { intRandomRange, shuffle } from '../helpers';
import '../styles/BarChart.css';

class BarChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seasonData: [],
      countData: [],
      episodeData: [],
      chartData: [],
      chartTotal: 0,
      showChart: false,
      seasonDetails: false,
      seasonNum: 1,
      lastUpdated: 0
    };

    this.myChart = null;
    this.chartContainerRef = React.createRef();
    this.submissionSequence = [];
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
    const newData = this.updateChartData(event.target.checked, this.state.countData, this.state.seasonNum);
    this.updateBackground(false, null, null, null);

    this.setState({
      chartData: newData.chartData,
      chartTotal: newData.chartTotal,
      seasonDetails: event.target.checked
    });
  }

  addEpisodeSubmissions = (data, season, episode) => {
    const newState = [...this.state.episodeData];

    if (!newState[season]) {
      newState[season] = [];
    }
    
    newState[season][episode] = data;
    return newState;
  }

  initSubmissionSequence = (season, episode, numSubmissions) => {
    for (let i = 0; i < numSubmissions; i++) {
      this.submissionSequence[season][episode][i] = i;
    }

    this.submissionSequence[season][episode] = shuffle(this.submissionSequence[season][episode]);
  }

  findBackground = async (season, episode, submissions) => {
    while (this.submissionSequence[season][episode].length > 0) {
      const i = this.submissionSequence[season][episode].pop();
      const curSubmission = submissions[season][episode][i];

      if (curSubmission.mediaLink) {
        const result = await this.testImage(curSubmission.mediaLink);
        if (result) break;
      }
    }

    if (this.submissionSequence[season][episode].length === 0) {
      this.initSubmissionSequence(season, episode, this.state.episodeData[season][episode].length);
    }
  }

  testImage = (url) => {
    return new Promise(resolve => {
      let realUrl = url;

      // If it's from Youtube, chances are it's not an image 
      if (/youtube/i.test(url)) {
        resolve(false);
        return;
      }

      // Convert http(s)://imgur.com links to http://i.imgur.com links if necessary 
      const isImgurLink = /https*:\/\/imgur\.com\/(\S+)/;
      if (isImgurLink.test(url)) {
        isImgurLink.lastIndex = 0;
        const slug = isImgurLink.exec(url)[1];

        realUrl = `http://i.imgur.com/${slug}.gif`;
      }

      // TODO: handle Imgur .gifv links (e.g. http://i.imgur.com/eFkL0Cc.gifv)
      // TODO: handle Frinkiac /caption links (e.g. https://frinkiac.com/caption/S08E01/911927)

      console.log(realUrl);

      const img = new Image();
      img.onload = () => {
        this.chartContainerRef.current.style.backgroundImage = `linear-gradient(#ffffffc0, #ffffffc0), url(${realUrl})`;
        resolve(true);
      };
  
      img.onerror = () => {
        resolve(false);
      };
  
      img.src = realUrl;
    });
  }

  updateBackground = (on, season, episode, submissions) => {
    if (on) {
      this.findBackground(season, episode, submissions)
        .then(() => {});
    }

    else {
      this.chartContainerRef.current.style.backgroundImage = '';
    }
  }

  chartClick = (event, elems) => {

    // in season mode
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
        const newData = this.updateChartData(true, this.state.countData, seasonClicked);
        // const randomEpisode = intRandomRange(0, this.state.seasonData[seasonClicked].numEpisodes-1);

        // if (this.state.episodeData[seasonClicked] && this.state.episodeData[seasonClicked][randomEpisode]) {
        //   console.log('has data');
        //   this.updateBackground(true, seasonClicked, randomEpisode, this.state.episodeData);

          this.setState({
            chartData: newData.chartData,
            chartTotal: newData.chartTotal,
            seasonNum: seasonClicked+1,
            seasonDetails: true
          });
        // }

        // else {
        //   console.log('has no data');
        //   fetch(`/submissions?season=${seasonClicked+1}&episode=${randomEpisode+1}seasonstats=false`)
        //   .then(res => res.json())
        //   .then(seasonData => {
        //     const newEpisodeData = this.addEpisodeSubmissions(seasonData.data, seasonClicked, randomEpisode);
        //     this.initSubmissionSequence(seasonClicked, randomEpisode, seasonData.data.length);
        //     this.updateBackground(true, seasonClicked, randomEpisode, newEpisodeData);

        //     this.setState({
        //       episodeData: newEpisodeData,
        //       chartData: newData.chartData,
        //       chartTotal: newData.chartTotal,
        //       seasonNum: seasonClicked+1,
        //       seasonDetails: true
        //     });
        //   });
        // }
      }

      else {
        //this.updateBackground(false, null, null, null);
      }
    }

    // in episode mode
    else {
      let episodeClicked = null;

      if (elems && elems.length > 0) {
        episodeClicked = elems[0]._index;
      }

      else {
        const mousePoint = Chart.helpers.getRelativePosition(event, this.myChart.chart);

        if (mousePoint.y >= this.myChart.scales['x-axis-0'].top) {
          episodeClicked = this.myChart.scales['x-axis-0'].getValueForPixel(mousePoint.x);
        }

        else {
          episodeClicked = null;
        }
      }

      if (episodeClicked !== null) {
        // if (this.state.episodeData[this.state.seasonNum-1] && this.state.episodeData[this.state.seasonNum-1][episodeClicked]) {
        //   console.log('has data');
        //   this.updateBackground(true, this.state.seasonNum-1, episodeClicked, this.state.episodeData);
        // }

        // else {
        //   console.log('has no data');
        //   fetch(`/submissions?season=${this.state.seasonNum}&episode=${episodeClicked+1}seasonstats=false`)
        //   .then(res => res.json())
        //   .then(seasonData => {
        //     const newEpisodeData = this.addEpisodeSubmissions(seasonData.data, this.state.seasonNum-1, episodeClicked);
        //     this.initSubmissionSequence(this.state.seasonNum-1, episodeClicked, seasonData.data.length);
        //     this.updateBackground(true, this.state.seasonNum-1, episodeClicked, newEpisodeData);

        //     this.setState({
        //       episodeData: newEpisodeData
        //     });
        //   });
        // }
      }

      else {
        // this.updateBackground(false, null, null, null);
      }
    }
  }

  componentDidMount = () => {
    //fetch('http://i.imgur.com/PemqiAk.jpg')
    //fetch('https://i.redd.it/0ocj1lm658o21.jpg')

    const seasonLabels = [];
    for (let i = 0; i < 1; i++) {
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

                for (let i = 0; i < seasonData.data.length; i++) {
                  const episodeSubmissions = [];

                  for (let j = 0; j < seasonData.data[i].numEpisodes; j++) {
                    episodeSubmissions.push([]);
                  }

                  this.submissionSequence.push(episodeSubmissions);
                }

                this.setState({
                  seasonData: seasonData.data,
                  countData: seasonStats.data,
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
      <div id="bar-chart" ref={this.chartContainerRef}>
        <ChartHeader show={this.state.showChart} dateString={dateString} chartTotal={this.state.chartTotal}/>

        <div id="chartWrapper" className={chartClass}>
          <canvas id="myChart" width="400" height="400"></canvas>
        </div>

        <SeasonDetails 
          checked={this.state.seasonDetails}
          handleChange={this.toggleSeasonDetails}
        />
      </div>
    );
  }
}

export default BarChart;