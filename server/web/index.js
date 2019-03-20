const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const store = require('./store');
const app = express();
const port = 5000;

const index = require('./routes/index');
const submissions = require('./routes/submissions');
const seasons = require('./routes/seasons');

app.use(morgan('tiny'));
app.set('etag', 'strong');

app.use('', index);
app.use('/submissions', submissions);
app.use('/seasons', seasons);

if (process.env.ENV === 'test') {
  mongoose.connect('mongodb://localhost/rSimpsonsStats_test', { useNewUrlParser: true } );
} else {
  mongoose.connect('mongodb://localhost/rSimpsonsStats', { useNewUrlParser: true } );
}

mongoose.set('useFindAndModify', false);
const db = mongoose.connection;

db.on('error', () => console.log('Could not connect to database'));
db.once('open', () => {
  console.log('Connected to database');
  const storeClient = store.init();

  storeClient.on('error', () => console.log('Could not connect to store'));
  storeClient.on('connect', () => {
    console.log('Connected to store');
    app.server = app.listen(port, () => console.log(`Reddit-Tron 2000 server listening on port ${port}!`));
  });
});

const shutDown = () => {
  console.log('Reddit-Tron 2000 server shutting down...');
  db.close();
  console.log('Disconnected from database.');
  store.getClient().quit();
  console.log('Disconnected from store.');
  process.exit(0);
};

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);