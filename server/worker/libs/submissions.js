const request = require('request');
const Submission = require('../../common/schemas/Submission');
const Season = require('../../common/schemas/Season');
const Meta = require('../../common/schemas/Meta');
const { logNotInTest, inlineWriteNotInTest } = require('../../common/utils');

const delayBuffer = 0;
const oneDayinSecs = 60 * 60 * 24;
const oneWeekinSecs = oneDayinSecs * 7;
let defaultDelay = 250;

let seasonData = null;
let lastUpdated = 0;

const _processSubmissions = (rawData, processedData) => {
  // Check for invalid arguments
  if (!rawData || !processedData || !processedData.submissions) {
    return processedData;
  }

  rawData.forEach(sub => {
    const isEpisode = /s0*(\d+)e0*(\d+)/i;
    const isNews = /news/i;
    const isOC = /oc/i;
    const isShitpost = /shitpost/i;

    processedData.totalCount++;

    if (isEpisode.test(sub.link_flair_text)) {
      const processedFlair = isEpisode.exec(sub.link_flair_text);
      const seasonNum = parseInt(processedFlair[1]);
      const episodeNum = parseInt(processedFlair[2]);

      if (seasonNum > 0 && seasonNum <= seasonData.length &&
        episodeNum > 0 && episodeNum <= seasonData[seasonNum - 1].numEpisodes) {
        processedData.episodeCount++;

        const subDetails = {
          id: sub.id,
          season: seasonNum,
          episode: episodeNum,
          title: sub.title,
          score: sub.score,
          comments: sub.num_comments,
          postedBy: sub.author,
          date: sub.created_utc,
          subLink: `https://reddit.com${sub.permalink}`,
          mediaLink: sub.url,
          ingestLevel: 0
        };

        // adjust ingest level based on age of post
        const age = ((new Date()) - (new Date(sub.created_utc * 1000))) / 1000;

        if (age >= oneWeekinSecs) {
          subDetails.ingestLevel = 2;
        }

        else if (age >= oneDayinSecs) {
          subDetails.ingestLevel = 1;
        }

        else {
          subDetails.ingestLevel = 0;
        }

        processedData.submissions.push(subDetails);
      }

      else {
        processedData.invalidCount++;
      }
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

const _querySubreddit = (limit = 10, pages = 1, before, after, delay = defaultDelay) => {
  const baseUrl = 'https://api.pushshift.io/reddit/submission/search';
  const startUtime = before !== 0 && !before ? Math.floor(new Date() / 1000) : before;
  const endUtime = after !== 0 && !after ? 0 : after;
  lastUpdated = Math.floor(new Date() / 1000);

  const query = {
    subreddit: 'TheSimpsons',
    limit: parseInt(limit) || 10,
    before: startUtime,
    after: endUtime,
    sort: 'desc',
    sort_type: 'created_utc'
  };

  let processedData = {
    totalCount: 0,
    episodeCount: 0,
    newsCount: 0,
    ocCount: 0,
    shitpostCount: 0,
    invalidCount: 0,
    unknownCount: 0,
    submissions: []
  };

  let currentPage = 0;

  const makeRequest = (resolve, reject) => {
    inlineWriteNotInTest(`On page ${currentPage + 1} of ${pages}`);

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

        processedData = { ..._processSubmissions(subs, processedData) };
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

const _updateDatabase = (data) => {
  return new Promise((resolve, reject) => {
    if (!data.submissions || !(data.submissions instanceof Array)) {
      reject({
        status: 'error',
        message: 'Could not update database: bad data.'
      });
    }

    logNotInTest('\nUpdating database...');

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

        logNotInTest(`Batch ${myNumber} complete...`);

        bulk = Submission.collection.initializeOrderedBulkOp();
      };
    };

    logNotInTest('Updating meta...');

    Meta.findOneAndUpdate({}, {
      lastUpdated: lastUpdated
    }, (err) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not update metadata.'
        });
        return;
      }

      logNotInTest('Done!');
      data.submissions.forEach(sub => {
        inlineWriteNotInTest(`Preparing bulk: ${counter + 1} of ${data.submissions.length}`);

        bulk.find({ id: sub.id }).upsert().updateOne(sub);
        counter++;

        if (counter % 1000 == 0) {
          logNotInTest(`\nExecuting batch ${batchNumber}...`);
          bulk.execute(batchFactory(batchNumber));

          batchNumber++;
        }
      });

      if (counter > 0) {
        bulk.execute((error) => {
          logNotInTest('\nExecuting final batch...');
          if (error) {
            reject({
              status: 'error',
              message: 'Could not update database: write failed.'
            });
          }

          else {
            logNotInTest('Done!');
            resolve({
              status: 'ok',
              message: 'Finished updating database!'
            });
          }
        });
      }

      else {
        logNotInTest('Done!');
        resolve({
          status: 'ok',
          message: 'Finished updating database!'
        });
      }
    });
  });
};

const checkRateLimit = () => {
  logNotInTest('Checking rate limit...');
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

const getSeasonDataFromDB = () => {
  return new Promise((resolve, reject) => {
    Season.find({}, null, { sort: { number: 1 } }, (err, data) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not query database.'
        });
        return;
      }

      seasonData = data;

      logNotInTest(`Number of seasons: ${data.length}`);
      resolve({
        status: 'ok',
        message: 'ok',
        data: data
      });
    });
  });
};

const getPastDate = (timeInterval) => {
  return new Promise((resolve, reject) => {
    Meta.findOne({}, (err, result) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not get past date.',
          date: 0
        });
      }

      else {
        resolve({
          status: 'ok',
          message: 'ok',
          date: result.lastUpdated - timeInterval
        });
      }
    });
  });
};

const getOldestSubByDate = () => {
  return new Promise((resolve, reject) => {
    Submission.find({}, '-_id', { sort: { date: 1 }, limit: 1 }, (err, result) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not get submission.'
        });
      }

      else if (result.length === 0) {
        resolve({
          status: 'ok',
          message: 'no submissions found',
          data: {
            date: 0
          }
        });
      }

      else {
        resolve({
          status: 'ok',
          message: 'ok',
          data: result[0]
        });
      }
    });
  });
};

const getSubmissions = (limit = 10, pages = 1, before, after = 0) => {
  return new Promise((resolve, reject) => {
    _querySubreddit(limit, pages, before, after, defaultDelay)
      .then(results => {
        _updateDatabase(results.data)
          .then(() => {
            resolve(results);
          });
      }, error => {
        reject(error);
      });
  });
};



module.exports = {
  checkRateLimit,
  //getOldestSubByIngest,
  getPastDate,
  getOldestSubByDate,
  getSeasonDataFromDB,
  getSubmissions
};