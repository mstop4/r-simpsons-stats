const store = require('../store');
const Submission = require('../../common/schemas/Submission');
const Season = require('../../common/schemas/Season');
const Meta = require('../../common/schemas/Meta');
const { logNotInTest } = require('../../common/utils');

let seasonData = null;

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

const _getSubmissionsFromDB = (query, limit, subCounts) => {
  return new Promise((resolve, reject) => {
    Submission.find(query, '-_id -__v', { limit: limit }, (err, subs) => {
      if (err) {
        reject();
        return;
      }

      if (subCounts) {
        const stats = [];
        for (let i = 0; i < seasonData.length; i++) {
          const season = [];

          for (let j = 0; j < seasonData[i].numEpisodes; j++) {
            season.push(0);
          }

          stats.push(season);
        }

        subs.forEach(sub => {
          if (sub.season > 0 && sub.season <= seasonData.length &&
            sub.episode > 0 && sub.episode <= seasonData[sub.season - 1].numEpisodes) {
            stats[sub.season - 1][sub.episode - 1] = stats[sub.season - 1][sub.episode - 1] + 1 || 1;
          }
        });

        resolve(stats);
      }

      resolve(subs);
    });
  });

};

const queryDatabase = (query, limit, subCounts) => {
  return new Promise((resolve, reject) => {
    // get last updated date from db
    Meta.findOne({}, '-_id -__v', (err, meta) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not get metadata.'
        });
        return;
      }

      // get last updated date from store
      store.getKey('lastUpdated')
        .then((date) => {
          if (date < meta.lastUpdated) {
            console.log('DB is newer');
          }

          else {
            console.log('Store is up-to-date');
          }

          _getSubmissionsFromDB(query, limit, subCounts)
            .then(result => {
              if (subCounts) {

                // try to update submission counts in store
                store.setKey('submissionCounts', JSON.stringify(result))
                  .then(() => {})
                  .catch(() => {
                    console.log('Warning: could not update submission counts in store');
                  })
                  .finally(() => {

                    //try to update last updated date in store
                    store.setKey('lastUpdated', meta.lastUpdated)
                      .then(() => { })
                      .catch(() => {
                        console.log('Warning: could not update last updated date in store');
                      })
                      .finally(() => {
                        resolve({
                          status: 'ok',
                          message: 'submission counts only',
                          lastUpdated: meta.lastUpdated,
                          data: result
                        });
                      });
                  });
              }

              else {
                resolve({
                  status: 'ok',
                  message: 'ok',
                  lastUpdated: meta.lastUpdated,
                  data: result
                });
              }
            })
            .catch(() => reject({
              status: 'error',
              message: 'Could not query database.'
            }));
        });
    });
  });
};

module.exports = {
  getSeasonDataFromDB,
  queryDatabase
};