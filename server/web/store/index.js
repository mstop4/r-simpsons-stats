const redis = require('redis');
let client = null;

const init = () => {
  if (client === null) {
    client = redis.createClient();
    return client;
  }

  console.log('Store client has already been initialized.');
  return false;
};

const getClient = () => client;

const getUpdateDate = () => {
  return new Promise((resolve, reject) => {
    client.get('lastUpdated', (err, result) => {
      if (err) {
        console.log('Could not get lastUpdated from store');
        reject(false);
      }
  
      else if (result) {
        resolve(result);
      }

      else {
        resolve(0);
      }
    });
  });
};

const setUpdateDate = (date) => {
  return new Promise((resolve, reject) => {
    client.set('lastUpdated', date, (err, result) => {
      if (err) {
        reject();
        return;
      }

      resolve(result);
    });
  });
};

module.exports = {
  init,
  getClient,
  getUpdateDate,
  setUpdateDate
};