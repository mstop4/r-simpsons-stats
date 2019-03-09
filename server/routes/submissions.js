const express = require('express');
const router = express.Router();

const { queryDatabase, getSubmissions } = require('../controllers/submissions');

router.get('/', (req, res) => {
  queryDatabase({
    season: parseInt(req.query.season)
  })
    .then(results => {
      res.json(results);
    }, error => {
      res.json(error);
    });
});

router.post('/', (req, res) => {
  getSubmissions(parseInt(req.query.limit), parseInt(req.query.pages))
    .then(results => {
      res.json(results);
    }, error => {
      res.send(error);
    });
});

module.exports = router;