const mongoose = require('mongoose');
const argv = require('yargs').argv;
const { getSeasonDataFromDB, checkRateLimit, getOldestSubByIngest, getSubmissions } = require('./libs/submissions');

const updateByIngest = (limit, pages, maxIngestLevel) => {
  return new Promise((resolve, reject) => {
    console.log('Updating submissions...');

    getOldestSubByIngest(maxIngestLevel)
      .then(sub => {
        getSubmissions(limit, pages, null, sub.date)
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
            case 'by-ingest':
              updateByIngest(argv.limit, argv.pages, 1)
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