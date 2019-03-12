const mongoose = require('mongoose');
//const Episode = require('../schemas/Episode');
const Season = require('../schemas/Season');

if (process.env.ENV === 'test') {
  mongoose.connect('mongodb://localhost/rSimpsonsStats_test');
} else {
  mongoose.connect('mongodb://localhost/rSimpsonsStats');
}

const db = mongoose.connection;
const numEpisodes = [
  13,
  22,
  24,
  22,
  22,
  25,
  25,
  25,
  25,
  23,
  22,
  21,
  22,
  22,
  22,
  21,
  22,
  22,
  20,
  21,
  23,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  21,
  19
];

const seedSeasons = async () => {
  console.log('Seeding seasons...');

  await numEpisodes.forEach(async (num, i) => {
    await Season.create({ number: i+1, numEpisodes: num });
  });
};

db.on('error', () => console.log('Could not connect to database'));
db.once('open', () => {
  console.log('Connected to database');
  seedSeasons()
    .then(() => {
      console.log('Done!');
      db.close();
    });
});