const request = require('request');
const expect = require('chai').expect;
const sinon = require('sinon');
const Submission = require('../schemas/Submission');
const subCon = require('../controllers/submissionsController');

const processedTestData = require('./data/processedTestData');
const rawTestData = require('./data/rawTestData');

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
      const processedData = {
        episodeCount: 0,
        newsCount: 0,
        ocCount: 0,
        shitpostCount: 0,
        unknownCount: 0,
        submissions: []
      };
  
      subCon.processSubmissions(rawTestData, processedData);

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
      const processedData = {...invalidProcessedData};
  
      subCon.processSubmissions(rawTestData, processedData);
  
      expect(processedData).to.deep.equal(invalidProcessedData);
    });

    it('should process nothing with no process data container', () => {
      const processedData = undefined;
  
      subCon.processSubmissions(rawTestData, processedData);
  
      expect(processedData).to.equal(undefined);
    });
  });

  describe('updateDatabase', () => {
    const fakeBulk = { 
      find: function () {
        return this;
      },

      upsert: function () {
        return this;
      }, 

      updateOne: sinon.spy(),
      execute: sinon.stub().yields(null, { updated: 'ok' })
    };

    beforeEach(() => {
      fakeBulk.updateOne.resetHistory();
      fakeBulk.execute.resetHistory();
    });

    it('should update the database', async () => {
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);
      await subCon.updateDatabase(processedTestData);
      
      expect(fakeBulk.updateOne.called).to.equal(true);
      expect(fakeBulk.execute.calledOnce).to.equal(true);
      stubBulk.restore();
    });

    it('should not update the database due to an error', async () => {
      const modFakeBulk = {...fakeBulk};
      modFakeBulk.execute = sinon.stub().yields({ error: 'yes' }, { updated: 'no' });
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(modFakeBulk);
      
      try {
        await subCon.updateDatabase(processedTestData);
      }
      
      catch (error) {
        expect(modFakeBulk.updateOne.called).to.equal(true);
        expect(modFakeBulk.execute.calledOnce).to.equal(true);
      }
      
      finally {
        stubBulk.restore();
      }
    });

    it('should update the database with no changes', async () => {
      const noSubs = [];
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);

      await subCon.updateDatabase(noSubs);
      expect(fakeBulk.updateOne.called).to.equal(false);
      expect(fakeBulk.execute.calledOnce).to.equal(true);
      stubBulk.restore();
    });
    
    it('should not update the database due to bad data', async () => {
      const wrongSubs = { name: 'Homer Thompson' };
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);

      try {
        await subCon.updateDatabase(wrongSubs);
      }
      
      catch (error) {
        expect(fakeBulk.updateOne.called).to.equal(false);
        expect(fakeBulk.execute.calledOnce).to.equal(false);
      }
      
      finally {
        stubBulk.restore();
      }
    });

    it('should not update the database due to undefined data', async () => {
      const wrongSubs = undefined;
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);

      try {
        await subCon.updateDatabase(wrongSubs);
      }
      
      catch (error) {
        expect(fakeBulk.updateOne.called).to.equal(false);
        expect(fakeBulk.execute.calledOnce).to.equal(false);
      }
      
      finally {
        stubBulk.restore();
      }
    });
  });

  describe('queryDatabase', () => {
    it('should resolve with a status of \'ok\'', async () => {
      const fakeFind = sinon.stub(Submission, 'find').yields(null, [1, 2, 3] );
      const result = await subCon.queryDatabase({}, 1, false);
      
      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.data).to.not.equal(undefined);
      fakeFind.restore();
    });

    it('should be rejected with a status of \'error\'', async () => {
      const fakeFind = sinon.stub(Submission, 'find').yields({ error: 'yes' }, null);
      try {
        await subCon.queryDatabase({}, 1, false);
      } 
      
      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Could not query database.');
        expect(error.data).to.equal(undefined);
      } 
      
      finally {
        fakeFind.restore();
      }
    });

    it('should resolve with season stats only', async () => {
      const fakeFind = sinon.stub(Submission, 'find').yields(null, processedTestData);
      const result = await subCon.queryDatabase({}, 1, true);
      
      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok - season stats only');
      expect(result.data).to.have.length(30);
      fakeFind.restore();
    });
  });

  describe('querySubreddit', () => {
    const processSubmissions = sinon.stub().returns(processedTestData);
    const processedDataString = JSON.stringify({
      data: processedTestData
    });

    it('should resolve with supplied arguments', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, processedDataString);

      const result = await subCon.querySubreddit(10, 5, 250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });

    it('should resolve using default arguments', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, processedDataString);

      const result = await subCon.querySubreddit();

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });

    it('should be rejected due to inability to connect with external API', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields({ error: 'yes'}, { statusCode: 404 }, null);

      try {
        await subCon.querySubreddit(10, 5, 250);
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot connect to external API');
        expect(error.data).to.equal(undefined);
      }

      finally {
        fakeRequest.restore();
      }
    });

    it('should be rejected due to inability to find external API resource', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 404 }, null);

      try {
        await subCon.querySubreddit(10, 5, 250);
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot find external API resource');
        expect(error.data).to.equal(undefined);
      }

      finally {
        fakeRequest.restore();
      }
    });

    it('should resolve even with a negative result limit', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, processedDataString);

      const result = await subCon.querySubreddit(-10, 5, 250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });

    it('should resolve even with a negative page limit', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, processedDataString);

      const result = await subCon.querySubreddit(10, -5, 250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });

    it('should resolve even with a negative delay', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, processedDataString);

      const result = await subCon.querySubreddit(10, 5, -250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });
  });
});
