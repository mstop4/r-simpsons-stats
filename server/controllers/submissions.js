const request = require('request');

const querySubreddit = (baseUrl, initQuery, startDate, pages, delay) => {
  let processedData = {
    episodeCount: 0,
    newsCount: 0,
    ocCount: 0,
    shitpostCount: 0,
    unknownCount: 0,
    submissions: []
  };

  const query = {
    ...initQuery,
    before: startDate
  };

  let currentPage = 0;

  const makeRequest = (resolve, reject) => {
    request({
      url: baseUrl,
      qs: query
    }, (error, response, body) => {

      if (error) {
        reject(error);
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
          resolve(processedData);
        }
      }
    });
  };

  return new Promise((resolve, reject) => makeRequest(resolve, reject)); 
};

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

module.exports = {
  processSubmissions,
  querySubreddit
};