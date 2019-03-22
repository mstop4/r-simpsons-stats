const express = require('express');
const router = express.Router();

const { queryDatabase, getSeasonDataFromDB } = require('../controllers/submissionsController');
let routeIsReady = false;

getSeasonDataFromDB()
  .then(() => {
    routeIsReady = true;
  }, error => {
    console.log(`Metadata error: ${error.message}`);
  });

router.get('/', (req, res) => {
  if (routeIsReady) {
    const query = {};
    const seasonStats = req.query.seasonstats ? req.query.seasonstats.toLowerCase() === 'true' : false;

    if (req.query.season && req.query.season !== '0') {
      query.season = parseInt(req.query.season);
    }

    if (req.query.episode && req.query.episode !== '0') {
      query.episode = parseInt(req.query.episode);
    }

    queryDatabase(query, parseInt(req.query.limit), seasonStats)
      .then(results => {
        res.json(results);
      }, error => {
        res.status(400).json(error);
      });
  }

  else {
    res.status(503).json({
      status: 'error',
      message: '/submissions is not ready yet'
    });
  }
});

module.exports = router;