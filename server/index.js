const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const app = express();
const port = 5000;

const index = require('./routes/index');
const submissions = require('./routes/submissions');

app.use(morgan('tiny'));

app.use('', index);
app.use('/submissions', submissions);

mongoose.connect('mongodb://localhost/rSimpsonsStats');
const db = mongoose.connection;

db.on('error', () => console.log('Could not connect to database'));
db.once('open', () => {
  console.log('Connected to database');
  app.listen(port, () => console.log(`r/TheSimpsons Stats server listening on port ${port}!`));
});