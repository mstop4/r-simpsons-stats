const request = require('request');
const Submission = require('../schemas/Submission');

const processSubmissions = (rawData, processedData) => {
  rawData.forEach(sub => {
    const isEpisode = /s0*(\d+)e0*(\d+)/i;
    const isNews = /news/i;
    const isOC = /oc/i;
    const isShitpost = /shitpost/i;

    if (isEpisode.test(sub.link_flair_text)) {
      const processedFlair = isEpisode.exec(sub.link_flair_text);
      processedData.episodeCount++;

      const subDetails = {
        id: sub.id,
        season: processedFlair[1],
        episode: processedFlair[2],
        score: sub.score,
        link: `https://reddit.com${sub.permalink}`
      };
  
      processedData.submissions.push(subDetails);
    }

    else if (isNews.test(sub.link_flair_text)) {
      processedData.newsCount++;
    }

    else if (isOC.test(sub.link_flair_text)) {
      processedData.ocCount++;
    }

    else if (isShitpost.test(sub.link_flair_text)) {
      processedData.shitpostCount++;
    }

    else {
      processedData.unknownCount++;
    }
  });

  return processedData;
};

const querySubreddit = (limit = 10, pages = 1, delay = 250) => {
  const baseUrl = 'https://api.pushshift.io/reddit/submission/search';

  const startTime = new Date;
  startTime.setDate(startTime.getDate() - 0);
  const startUtime = Math.floor(startTime.getTime() / 1000);

  const query = {
    subreddit: 'TheSimpsons',
    limit: parseInt(limit) || 10,
    before: startUtime
  };

  let processedData = {
    episodeCount: 0,
    newsCount: 0,
    ocCount: 0,
    shitpostCount: 0,
    unknownCount: 0,
    submissions: []
  };

  let currentPage = 0;

  const makeRequest = (resolve, reject) => {
    request({
      url: baseUrl,
      qs: query
    }, (error, response, body) => {

      if (error) {
        reject({
          status: 'error',
          message: 'Cannot connect to external API' 
        });
      }

      else if (response.statusCode === 404) {
        reject({
          status: 'error',
          message: 'Cannot find external API resource'
        });
      }

      else {
        const subs = JSON.parse(body).data;
        processedData = {...processSubmissions(subs, processedData)};

        currentPage++;
        
        if (currentPage < pages) {
          query.before = subs[subs.length-1].created_utc + 1;
          setTimeout(() => makeRequest(resolve, reject), delay);
        }

        else {
          resolve({
            status: 'ok',
            message: 'ok',
            data: {...processedData}
          });
        }
      }
    });
  };

  return new Promise((resolve, reject) => makeRequest(resolve, reject)); 
};

const updateDatabase = (limit = 10, pages = 1) => {
  return new Promise((resolve, reject) => {
    querySubreddit(limit, pages, 250)
      .then(results => {
        console.log(results);
        resolve('OK');
      }, error => {
        console.log(error);
        reject('nope');
      });
  });
};

module.exports = {
  processSubmissions,
  querySubreddit,
  updateDatabase
};