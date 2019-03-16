const Submission = require('../../common/schemas/Submission');
const Season = require('../../common/schemas/Season');
const Meta = require('../../common/schemas/Meta');
const { logNotInTest } = require('../../common/utils');

let seasonData;

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

const queryDatabase = (query, limit, seasonStats) => {
  return new Promise((resolve, reject) => {
    Meta.findOne({}, '-_id -__v', (err, meta) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not get metadata.'
        });
        return;
      }

      Submission.find(query, '-_id -__v', { limit: limit }, (err, subs) => {
        if (err) {
          reject({
            status: 'error',
            message: 'Could not query database.'
          });
        }
  
        if (seasonStats) {
          const stats = [];
          for (let i = 0; i < seasonData.length; i++) {
            stats.push([]);
          }
  
          subs.forEach(sub => {
            if (sub.season > 0 && sub.season <= seasonData.length &&
              sub.episode > 0 && sub.episode <= seasonData[sub.season - 1].numEpisodes) {
              stats[sub.season - 1][sub.episode - 1] = stats[sub.season - 1][sub.episode - 1] + 1 || 1;
            }
          });
  
          resolve({
            status: 'ok',
            message: 'season stats only',
            lastUpdated: meta.lastUpdated,
            data: stats
          });
        }
  
        resolve({
          status: 'ok',
          message: 'ok',
          lastUpdated: meta.lastUpdated,
          data: subs
        });
      });
    });
  });
};

module.exports = {
  getSeasonDataFromDB,
  queryDatabase
};