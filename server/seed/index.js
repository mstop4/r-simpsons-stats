const mongoose = require('mongoose');
//const Episode = require('../schemas/Episode');
const Season = require('../schemas/Season');
const Meta = require('../schemas/Meta');

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
  await Season.deleteMany({});
  await numEpisodes.forEach(async (num, i) => {
    await Season.create({ number: i+1, numEpisodes: num });
  });
};

const seedMeta = async () => {
  console.log('Seeding meta...');
  await Meta.deleteMany({});
  await Meta.create({
    lastUpdated: 0,
    subsAnalyzed: 0,
    episodeCount: 0,
    newsCount: 0,
    ocCount: 0,
    shitpostCount: 0,
    invalidCount: 0,
    unknownCount: 0
  });
};

if (process.env.ENV === 'test') {
  mongoose.connect('mongodb://localhost/rSimpsonsStats_test', { useNewUrlParser: true } );
} else {
  mongoose.connect('mongodb://localhost/rSimpsonsStats', { useNewUrlParser: true } );
}

const db = mongoose.connection;

db.on('error', () => console.log('Could not connect to database'));
db.once('open', async () => {
  console.log('Connected to database');
  await seedSeasons();
  console.log('Done!');
  await seedMeta();
  db.close();
});