const Season = require('../schemas/Season');

const getSeasons = () => {
  return new Promise((resolve, reject) => {
    Season.find({}, null, { sort: { number: 1 } }, (err, results) => {
      if (err) {
        reject({
          status: 'error',
          message: 'Could not query database.'
        });
        return;
      }

      resolve({
        status: 'ok',
        message: 'ok',
        data: results
      });
    });
  });
};

module.exports = {
  getSeasons
};