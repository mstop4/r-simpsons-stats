const mongoose = require('mongoose');
const argv = require('yargs').argv;
const { getSeasonDataFromDB, checkRateLimit, getOldestSubFromDB, getNewestSubFromDB, getSubmissions } = require('./libs/submissions');

const updateOldest = (limit, pages) => {
  return new Promise((resolve, reject) => {
    checkRateLimit()
      .then((delay) => {
        console.log(`Setting request delay to ${delay.message} ms`);
        console.log('Getting oldest submission...');

        getOldestSubFromDB()
          .then(oldest => {
            console.log(`Getting submissions before ${oldest.data.date}...`);

            getSubmissions(limit, pages, oldest.data.date)
              .then(() => {
                resolve('Done!');
              }, error => {
                reject(`Error: ${error.message}`);
              });
          }, error => {
            reject(`Error: ${error.message}`);
          });
      });
  });
};

const updateNewest = (limit, pages) => {
  return new Promise((resolve, reject) => {
    checkRateLimit()
      .then((delay) => {
        console.log(`Setting request delay to ${delay.message} ms`);
        console.log('Getting newest submission...');

        getNewestSubFromDB()
          .then(newest => {
            console.log(`Getting submissions after ${newest.data.date}...`);

            getSubmissions(limit, pages, null, newest.data.date)
              .then(() => {
                resolve('Done!');
              }, error => {
                reject(`Error: ${error.message}`);
              });
          }, error => {
            reject(`Error: ${error.message}`);
          });
      });
  });
};

const updateRange = (limit, pages, before, after) => {
  return new Promise((resolve, reject) => {
    checkRateLimit()
      .then((delay) => {
        console.log(`Setting request delay to ${delay.message} ms`);
        console.log('Getting submissions...');

        getSubmissions(limit, pages, before, after)
          .then(() => {
            resolve('Done!');
          }, error => {
            reject(`Error: ${error.message}`);
          });
      });
  });
};

if (process.env.ENV === 'test') {
  mongoose.connect('mongodb://localhost/rSimpsonsStats_test', { useNewUrlParser: true });
} else {
  mongoose.connect('mongodb://localhost/rSimpsonsStats', { useNewUrlParser: true });
}

const db = mongoose.connection;

db.on('error', () => console.log('Could not connect to database'));
db.once('open', () => {
  console.log('Connected to database');
  getSeasonDataFromDB()
    .then(() => {

      switch (argv.mode) {
        case 'newest':
          updateNewest(argv.limit, argv.pages)
            .then(() => {
              console.log('Update process complete!');
            })
            .catch(error => {
              console.log(`Error: ${error}`);
            })
            .finally(() => {
              console.log('Work finished. Goodbye!');
              db.close();
            });
          break;

        case 'oldest':
          updateOldest(argv.limit, argv.pages)
            .then(() => {
              console.log('Update process complete!');
            })
            .catch(error => {
              console.log(`Error: ${error}`);
            })
            .finally(() => {
              console.log('Work finished. Goodbye!');
              db.close();
            });
          break;

        default:
          updateRange(argv.limit, argv.pages, argv.before, argv.after)
            .then(() => {
              console.log('Update process complete!');
            })
            .catch(error => {
              console.log(`Error: ${error}`);
            })
            .finally(() => {
              console.log('Work finished. Goodbye!');
              db.close();
            });
      }
    }, error => {
      console.log(`Error: ${error.message}`);
      console.log('Work could not be completed. Goodbye!');
      db.close();
    });
});