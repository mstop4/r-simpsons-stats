const expect = require('chai').expect;
const sinon = require('sinon');
const Submission = require('../schemas/Submission');
const subCon = require('../controllers/submissionsController');

process.env.ENV = 'test';

describe('Submissions Controller', () => {
  describe('processSubmissions', () => {

    const templateProcessedData = {
      episodeCount: 0,
      newsCount: 0,
      ocCount: 0,
      shitpostCount: 0,
      unknownCount: 0,
      submissions: []
    };

    const invalidProcessedData = {
      secretIngredient: 'love'
    };

    it('should process and tally all submissions', () => {
      const rawData = require('./data/rawTestData.js');
      const processedData = {
        episodeCount: 0,
        newsCount: 0,
        ocCount: 0,
        shitpostCount: 0,
        unknownCount: 0,
        submissions: []
      };
  
      subCon.processSubmissions(rawData, processedData);

      expect(processedData.episodeCount).to.equal(9);
      expect(processedData.newsCount).to.equal(0);
      expect(processedData.ocCount).to.equal(3);
      expect(processedData.shitpostCount).to.equal(1);
      expect(processedData.unknownCount).to.equal(37);
      expect(processedData.submissions).to.have.lengthOf(9);
    });

    it('should process nothing with empty raw data array', () => {
      const rawData = [];
      const processedData = {...templateProcessedData};
  
      subCon.processSubmissions(rawData, processedData);

      expect(processedData).to.deep.equal(templateProcessedData);
    });

    it('should not process anything with no raw data at all', () => {
      const rawData = undefined;
      const processedData = {...templateProcessedData};
  
      subCon.processSubmissions(rawData, processedData);

      expect(processedData).to.deep.equal(templateProcessedData);
    });

    it('should process nothing with invalid process data container', () => {
      const rawData = require('./data/rawTestData.js');
      const processedData = {...invalidProcessedData};
  
      subCon.processSubmissions(rawData, processedData);
  
      expect(processedData).to.deep.equal(invalidProcessedData);
    });

    it('should process nothing with no process data container', () => {
      const rawData = require('./data/rawTestData.js');
      const processedData = undefined;
  
      subCon.processSubmissions(rawData, processedData);
  
      expect(processedData).to.equal(undefined);
    });
  });

  describe('updateDatabase', () => {

    const submissions = require('./data/processedTestData');
    const fakeBulk = { 
      find: function (query) {
        return this;
      },

      upsert: function () {
        return this;
      }, 

      updateOne: sinon.spy(),
      execute: sinon.stub().yields(null, { updated: 'ok' })
    };

    it('should update the database', () => {
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);

      subCon.updateDatabase(submissions);

      stubBulk.restore();
      expect(fakeBulk.updateOne.called).to.equal(true);
      expect(fakeBulk.execute.called).to.equal(true);
    });
  });
});
