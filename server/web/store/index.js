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

const getKey = (key) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, result) => {
      if (err) {
        console.log(`Could not get ${key} from store`);
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

const setKey = (key, value) => {
  return new Promise((resolve, reject) => {
    client.set(key, value, (err, result) => {
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
  getKey,
  setKey
};