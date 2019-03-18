const mongoose = require('mongoose');
const argv = require('yargs').argv;
const { getSeasonDataFromDB, checkRateLimit, getPastDate, getOldestSubByDate, getSubmissions } = require('./libs/submissions');

const updateNewest = (limit, pages) => {
  const timeInterval = (60 * 60) * (24 * 7 + 1); // one week + one hour

  return new Promise((resolve, reject) => {
    getPastDate(timeInterval)
      .then(result => {
        console.log(`Updating submissions newer than ${result.date - 1}...`);
        getSubmissions(limit, pages, null, result.date - 1)
          .then(() => {
            resolve('Done!');
          }, error => {
            reject(`Error: ${error.message}`);
          });
      });
  });
};

const updateOldest = (limit, pages) => {
  return new Promise((resolve, reject) => {
    getOldestSubByDate()
      .then(sub => {
        console.log(`Updating submissions older than ${sub.data.date+1}...`);
        getSubmissions(limit, pages, sub.data.date+1, null)
          .then(() => {
            resolve('Done!');
          }, error => {
            reject(`Error: ${error.message}`);
          });
      });
  });
};

const updateRange = (limit, pages, before, after) => {
  return new Promise((resolve, reject) => {
    console.log('Getting submissions...');

    getSubmissions(limit, pages, before, after)
      .then(() => {
        resolve('Done!');
      }, error => {
        reject(`Error: ${error.message}`);
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

      checkRateLimit()
        .then((delay) => {

          console.log(`Setting request delay to ${delay.message} ms`);

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
});