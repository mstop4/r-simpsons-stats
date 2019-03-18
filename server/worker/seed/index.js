const mongoose = require('mongoose');
//const Episode = require('../../common/schemas/Episode');
const Submission = require('../../common/schemas/Submission');
const Season = require('../../common/schemas/Season');
const Meta = require('../../common/schemas/Meta');

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
  20
];

const clearSubmissions = async () => {
  console.log('Clearing submissions...');
  await Submission.deleteMany({});
};

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
    lastUpdated: 0
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
  //await seedMeta();
  //await clearSubmissions();
  console.log('Done!');
  db.close();
});