const request = require('request');
const Submission = require('../schemas/Submission');
const delayBuffer = 0;
let defaultDelay = 250;

const checkRateLimit = () => {
  console.log('Checking rate limit...');
  return new Promise((resolve, reject) => {
    request.get('https://api.pushshift.io/meta', (error, response, body) => {
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
        const metadata = JSON.parse(body);
        defaultDelay = 60000 / metadata.server_ratelimit_per_minute + delayBuffer;
        resolve({
          status: 'ok',
          message: defaultDelay
        });
      }
    });
  });
};

const getOldestSubFromDB = () => {
  return new Promise((resolve, reject) => {
    Submission.findOne({}, null, { sort: {date: 1} }, (err, sub) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not query database.'
        });
      }

      if (!sub) {
        const startTime = new Date;
        const startUtime = Math.floor(startTime.getTime() / 1000);

        resolve({
          status: 'ok',
          message: 'no submissions in database, returning current time',
          data: {
            date: startUtime
          }
        });
      }

      resolve({
        status: 'ok',
        message: 'ok',
        data: sub
      });
    });
  });
};

const getNewestSubFromDB = () => {
  return new Promise((resolve, reject) => {
    Submission.findOne({}, null, { sort: {date: -1} }, (err, sub) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not query database.'
        });
      }

      if (!sub) {
        resolve({
          status: 'ok',
          message: 'no submissions in database, returning 0',
          data: {
            date: 0
          }
        });
      }

      resolve({
        status: 'ok',
        message: 'ok',
        data: sub
      });
    });
  });
};

const processSubmissions = (rawData, processedData) => {

  // Check for invalid arguments
  if (!rawData || !processedData || !processedData.submissions) {
    return processedData;
  }

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
        season: parseInt(processedFlair[1]),
        episode: parseInt(processedFlair[2]),
        score: sub.score,
        date: sub.created_utc,
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

const querySubreddit = (limit = 10, pages = 1, before, after, delay = defaultDelay) => {
  const baseUrl = 'https://api.pushshift.io/reddit/submission/search';
  let startUtime;
  let endUtime;

  if (before !== 0 && !before) {
    const startTime = new Date;
    startUtime = Math.floor(startTime.getTime() / 1000);
  }

  else {
    startUtime = before;
  }

  endUtime = after !== 0 && !after ? 0 : after; 

  const query = {
    subreddit: 'TheSimpsons',
    limit: parseInt(limit) || 10,
    before: startUtime,
    after: endUtime,
    sort: 'desc',
    sort_type: 'created_utc'
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
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`On page ${currentPage + 1} of ${pages}`);

    request.get({
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

        if (subs.length === 0) {
          resolve({
            status: 'ok',
            message: `only ${processedData.submissions.length} submissions processed`,
            data: processedData
          });
          return;
        }

        processedData = { ...processSubmissions(subs, processedData) };
        currentPage++;

        if (currentPage < pages) {
          query.before = subs[subs.length - 1].created_utc;
          setTimeout(() => makeRequest(resolve, reject), delay);
        }

        else {
          resolve({
            status: 'ok',
            message: `all ${processedData.submissions.length} submissions processed`,
            data: processedData
          });
        }
      }
    });
  };

  return new Promise((resolve, reject) => makeRequest(resolve, reject));
};

const updateDatabase = (data) => {
  return new Promise((resolve, reject) => {
    if (!data || !(data instanceof Array)) {
      reject({
        status: 'error',
        message: 'Could not update database: bad data.'
      });
    }

    if (process.env.ENV !== 'test') {
      console.log('\nUpdating database...');
    }

    let bulk = Submission.collection.initializeOrderedBulkOp();
    let counter = 0;
    let batchNumber = 0;

    const batchFactory = (n) => {
      const myNumber = n;
    
      return (error) => {
        if (error) {
          reject({
            status: 'error',
            message: 'Could not update database: write failed.'
          });
        }
    
        console.log(`Batch ${myNumber} complete...`);
        bulk = Submission.collection.initializeOrderedBulkOp();
      };
    };

    data.forEach(sub => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Preparing bulk: ${counter+1} of ${data.length}`);
      bulk.find({ id: sub.id }).upsert().updateOne(sub);
      counter++;

      if (counter % 1000 == 0) {
        console.log(`\nExecuting batch ${batchNumber}...`);
        bulk.execute(batchFactory(batchNumber));

        batchNumber++;
      }
    });

    if (counter > 0) {
      bulk.execute((error) => {
        console.log('\nExecuting final batch...');
        if (error) {
          reject({
            status: 'error',
            message: 'Could not update database: write failed.'
          });
        }

        else {
          console.log('Done!');
          resolve({
            status: 'ok',
            message: 'Finished updating database!',
          });
        }
      });
    }

    else {
      console.log('Done!');
      resolve({
        status: 'ok',
        message: 'Finished updating database!',
      });
    }
  });
};

const getSubmissions = (limit = 10, pages = 1, before, after = 0) => {
  return new Promise((resolve, reject) => {
    querySubreddit(limit, pages, before, after, defaultDelay)
      .then(results => {
        updateDatabase(results.data.submissions)
          .then(() => {
            resolve(results);
          });
      }, error => {
        reject(error);
      });
  });
};

const queryDatabase = (query, limit, seasonStats) => {
  const numSeasons = 30;

  return new Promise((resolve, reject) => {
    Submission.find(query, null, { limit: limit }, (err, subs) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not query database.'
        });
      }

      if (seasonStats) {
        const stats = [];
        for (let i = 0; i < numSeasons; i++) {
          stats.push(0);
        }

        subs.forEach(sub => {
          if (sub.season <= numSeasons) {
            stats[sub.season - 1]++;
          }
        });

        resolve({
          status: 'ok',
          message: 'season stats only',
          data: stats
        });
      }

      resolve({
        status: 'ok',
        message: 'ok',
        data: subs
      });
    });
  });
};

module.exports = {
  checkRateLimit,
  getOldestSubFromDB,
  getNewestSubFromDB,
  processSubmissions,
  querySubreddit,
  updateDatabase,
  getSubmissions,
  queryDatabase
};