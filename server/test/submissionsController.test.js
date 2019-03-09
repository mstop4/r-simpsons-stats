const expect = require('chai').expect;
//const sinon = require('sinon');
const submissionsController = require('../controllers/submissionsController');

describe('Submissions Controller', () => {
  describe('processSubmissions', () => {
    it('should process and tally all submissions', () => {
      const rawData = require('./data/testData.js');
      const processedData = {
        episodeCount: 0,
        newsCount: 0,
        ocCount: 0,
        shitpostCount: 0,
        unknownCount: 0,
        submissions: []
      };
  
      submissionsController.processSubmissions(rawData, processedData);

      expect(processedData.episodeCount).to.equal(9);
      expect(processedData.newsCount).to.equal(0);
      expect(processedData.ocCount).to.equal(3);
      expect(processedData.shitpostCount).to.equal(1);
      expect(processedData.unknownCount).to.equal(37);
      expect(processedData.submissions).to.have.lengthOf(9);
    });

    it('should process nothing with empty raw data array', () => {
      const rawData = [];
      const processedData = {
        episodeCount: 0,
        newsCount: 0,
        ocCount: 0,
        shitpostCount: 0,
        unknownCount: 0,
        submissions: []
      };
  
      submissionsController.processSubmissions(rawData, processedData);
  
      expect(processedData.episodeCount).to.equal(0);
      expect(processedData.newsCount).to.equal(0);
      expect(processedData.ocCount).to.equal(0);
      expect(processedData.shitpostCount).to.equal(0);
      expect(processedData.unknownCount).to.equal(0);
      expect(processedData.submissions).to.have.lengthOf(0);
    });

    it('should not process anything with no raw data at all', () => {
      const rawData = undefined;
      const processedData = {
        episodeCount: 0,
        newsCount: 0,
        ocCount: 0,
        shitpostCount: 0,
        unknownCount: 0,
        submissions: []
      };
  
      submissionsController.processSubmissions(rawData, processedData);
  
      expect(processedData.episodeCount).to.equal(0);
      expect(processedData.newsCount).to.equal(0);
      expect(processedData.ocCount).to.equal(0);
      expect(processedData.shitpostCount).to.equal(0);
      expect(processedData.unknownCount).to.equal(0);
      expect(processedData.submissions).to.have.lengthOf(0);
    });

    it('should process nothing with invalid process data container', () => {
      const rawData = require('./data/testData.js');
      const processedData = {};
  
      submissionsController.processSubmissions(rawData, processedData);
  
      expect(processedData.episodeCount).to.equal(undefined);
      expect(processedData.newsCount).to.equal(undefined);
      expect(processedData.ocCount).to.equal(undefined);
      expect(processedData.shitpostCount).to.equal(undefined);
      expect(processedData.unknownCount).to.equal(undefined);
      expect(processedData.submissions).to.equal(undefined);
    });

    it('should process nothing with no process data container', () => {
      const rawData = require('./data/testData.js');
      const processedData = undefined;
  
      submissionsController.processSubmissions(rawData, processedData);
  
      expect(processedData).to.equal(undefined);
    });
  });
});
