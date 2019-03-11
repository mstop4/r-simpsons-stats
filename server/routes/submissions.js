const express = require('express');
const router = express.Router();

const { queryDatabase, getSubmissions, checkRateLimit, getOldestSubFromDB, getNewestSubFromDB } = require('../controllers/submissionsController');

router.get('/', (req, res) => {
  const query = {};
  const seasonStats = req.query.seasonstats ? req.query.seasonstats.toLowerCase() === 'true' : false;

  if (req.query.season !== '0') {
    query.season = parseInt(req.query.season);
  }

  queryDatabase(query, parseInt(req.query.limit), seasonStats)
    .then(results => {
      res.json(results);
    }, error => {
      res.json(error);
    });
});

router.put('/updateoldest', (req, res) => {
  checkRateLimit()
    .then((meta) => {
      console.log(`Setting request delay to ${meta.message} ms`);
      console.log('Getting oldest submission...');
      getOldestSubFromDB()
        .then((oldest) => {
          console.log(`Getting submissions before ${oldest.data.date}...`);
          getSubmissions(parseInt(req.query.limit), parseInt(req.query.pages), oldest.data.date)
            .then(results => {
              res.json(results);
            }, error => {
              res.send(error);
            });
        });
    });
});

router.put('/updatenewest', (req, res) => {
  checkRateLimit()
    .then((meta) => {
      console.log(`Setting request delay to ${meta.message} ms`);
      console.log('Getting newest submission...');
      getNewestSubFromDB()
        .then((newest) => {
          console.log(`Getting submissions after ${newest.data.date}...`);
          getSubmissions(parseInt(req.query.limit), parseInt(req.query.pages), null, newest.data.date)
            .then(results => {
              res.json(results);
            }, error => {
              res.send(error);
            });
        });
    });
});

router.put('/', (req, res) => {
  checkRateLimit()
    .then((meta) => {
      console.log(`Setting request delay to ${meta.message} ms`);
      console.log('Getting submissions...');
      getSubmissions(parseInt(req.query.limit), parseInt(req.query.pages), parseInt(req.query.before), parseInt(req.query.after))
        .then(results => {
          res.json(results);
        }, error => {
          res.send(error);
        });
    });
});

module.exports = router;