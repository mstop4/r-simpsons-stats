const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const app = express();
const port = 5000;

const index = require('./routes/index');
const submissions = require('./routes/submissions');
const seasons = require('./routes/seasons');

app.use(morgan('tiny'));

app.use('', index);
app.use('/submissions', submissions);
app.use('/seasons', seasons);

if (process.env.ENV === 'test') {
  mongoose.connect('mongodb://localhost/rSimpsonsStats_test');
} else {
  mongoose.connect('mongodb://localhost/rSimpsonsStats');
}
const db = mongoose.connection;

db.on('error', () => console.log('Could not connect to database'));
db.once('open', () => {
  console.log('Connected to database');
  app.server = app.listen(port, () => console.log(`r/TheSimpsons Stats server listening on port ${port}!`));
});