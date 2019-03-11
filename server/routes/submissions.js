const express = require('express');
const router = express.Router();

const { queryDatabase, getSubmissions, checkRateLimit } = require('../controllers/submissionsController');

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

router.put('/', (req, res) => {
  checkRateLimit()
    .then(() => {
      getSubmissions(parseInt(req.query.limit), parseInt(req.query.pages), parseInt(req.query.before))
        .then(results => {
          res.json(results);
        }, error => {
          res.send(error);
        });
    });
});

module.exports = router;