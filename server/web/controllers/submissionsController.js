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

const _getSubmissionsFromDB = (query, limit, subCounts, lastUpdated) => {
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

        const newSubCounts = {
          lastUpdated: lastUpdated,
          data: stats
        };

        // try to update submission counts in store
        store.setKey('submissionCounts', JSON.stringify(newSubCounts))
          .then(null
            , () => {
              console.log('Warning: could not update submission counts in store');
            })
          .then(() => {
            resolve({
              message: 'submission counts only',
              data: stats
            });
          });
      }

      else {
        const newSubs = {
          lastUpdated: lastUpdated,
          data: subs
        };

        // try to update submission counts in store
        store.setHash(`season${query.season}`, JSON.stringify(newSubs))
          .then(null
            , () => {
              console.log('Warning: could not update submissions in store');
            })
          .then(() => {
            resolve({
              message: 'ok',
              data: subs
            });
          });
      }
    });
  });
};

const _getSubmissionsFromStore = (season) => {
  return new Promise((resolve, reject) => {
    // 0 = counts only
    if (season === 0) {
      store.getKey('submissionCounts')
        .then(stats => {
          resolve(stats);
        }, () => {
          reject();
        });
    }

    else {
      store.getKey(`season${season}`)
        .then(subs => {
          resolve({
            message: 'ok',
            data: subs
          });
        }, () => {
          reject();
        });
    }
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

      if (!subCounts) {

        // get data for a specific season
        if (query.season !== 0) {
          _getSubmissionsFromStore(query.season)
            .then(res => {
              const result = JSON.parse(res);

              if (result.lastUpdated >= meta.lastUpdated) {
                resolve({
                  status: 'ok',
                  message: result.message,
                  lastUpdated: meta.lastUpdated,
                  data: result.data
                });
              }

              else {
                _getSubmissionsFromDB(query, limit, false, meta.lastUpdated)
                  .then(result => {
                    resolve({
                      status: 'ok',
                      message: result.message,
                      lastUpdated: meta.lastUpdated,
                      data: result.data
                    });
                  }, () => reject({
                    status: 'error',
                    message: 'Could not query database'
                  }));
              }
            }, () => reject({
              status: 'error',
              message: 'Could not query store'
            })
            );
        }

        // get data for all seasons (currently not supported by store)
        else {
          _getSubmissionsFromDB(query, limit, false, meta.lastUpdated)
            .then(result => {
              resolve({
                status: 'ok',
                message: result.message,
                lastUpdated: meta.lastUpdated,
                data: result.data
              });
            }, () => reject({
              status: 'error',
              message: 'Could not query database'
            }));
        }
      }

      else {
        _getSubmissionsFromStore(0)
          .then(res => {
            const result = JSON.parse(res);

            if (result.lastUpdated >= meta.lastUpdated) {
              resolve({
                status: 'ok',
                message: 'submission counts only',
                lastUpdated: meta.lastUpdated,
                data: result.data
              });
            }

            else {
              _getSubmissionsFromDB(query, limit, true, meta.lastUpdated)
                .then(result => {
                  resolve({
                    status: 'ok',
                    message: result.message,
                    lastUpdated: meta.lastUpdated,
                    data: result.data
                  });
                }, () => reject({
                  status: 'error',
                  message: 'Could not query database'
                }));
            }
          }, () => reject({
            status: 'error',
            message: 'Could not query store'
          })
          );
      }
    });
  });
};

module.exports = {
  getSeasonDataFromDB,
  queryDatabase
};