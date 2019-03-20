process.env.ENV = 'test';

const expect = require('chai').expect;
const sinon = require('sinon');
const rewire = require('rewire');
//const Submission = require('../../common/schemas/Submission');
const Season = require('../../common/schemas/Season');
const Meta = require('../../common/schemas/Meta');
let subCon = rewire('../controllers/submissionsController');

//const processedTestData = require('../../common/test/data/processedTestData');
const seasonTestData = require('../../common/test/data/seasonData');

describe('getSeasonDataFromDB', () => {

  it('should resolve with a status of \'ok\'', async () => {
    const stubFind = sinon.stub(Season, 'find').yields(null, { status: 'ok', message: 'ok' });
    const result = await subCon.getSeasonDataFromDB();
    const seasonData = subCon.__get__('seasonData');

    expect(result.status).to.equal('ok');
    expect(result.message).to.equal('ok');
    expect(result.data).to.not.equal(undefined);
    expect(seasonData).to.not.equal(null);

    stubFind.restore();
    subCon.__set__('seasonData', null);
  });

  it('should be rejected due to being unable to query database', async () => {
    const stubFind = sinon.stub(Season, 'find').yields({ error: 'yes'}, null);
    let seasonData;

    try {
      await subCon.getSeasonDataFromDB();
    } 
    
    catch (error) {
      seasonData = subCon.__get__('seasonData');
      expect(error.status).to.equal('error');
      expect(error.message).to.equal('Could not query database.');
      expect(error.data).to.equal(undefined);
      expect(seasonData).to.equal(null);
    } 
    
    finally {
      stubFind.restore();
      subCon.__set__('seasonData', null);
    }
  });
});

describe('queryDatabase', () => {
  //const stubFind = sinon.stub(Submission, 'find').yields(null, [1, 2, 3] );
  const stubGetKey = sinon.stub();
  const stubSetKey = sinon.stub().resolves('OK');
  const _getSubmissionsFromDB = sinon.stub();
  const _getSubmissionCountsFromStore = sinon.stub();
  const stubMeta = sinon.stub(Meta, 'findOne');

  before(() => {
    subCon.__set__('seasonData', seasonTestData);

    const stubStore = {
      getKey: stubGetKey,
      setKey: stubSetKey
    };

    subCon.__set__('store', stubStore);
    subCon.__set__('_getSubmissionsFromDB', _getSubmissionsFromDB);
    subCon.__set__('_getSubmissionCountsFromStore', _getSubmissionCountsFromStore);
  });

  after(() => {
    subCon.__set__('seasonData', null);
    subCon = rewire('../controllers/submissionsController');
    stubMeta.restore();
  });

  afterEach(() => {
    stubMeta.reset();
    stubGetKey.reset();
    stubSetKey.reset();
    _getSubmissionsFromDB.reset();
    _getSubmissionCountsFromStore.reset();
  });

  it('should get full submissions from database', async () => {
    stubGetKey.withArgs('lastUpdated').resolves(1000000);
    stubSetKey.resolves('OK');

    _getSubmissionsFromDB.resolves({
      message: 'ok',
      data: [1, 2, 3]
    });
    _getSubmissionCountsFromStore.resolves([1, 2, 3]);
    stubMeta.yields(null, { lastUpdated: 2000000 });

    const result = await subCon.queryDatabase({}, 1, false);

    expect(result.status).to.equal('ok');
    expect(result.message).to.equal('ok');
    expect(result.lastUpdated).to.equal(2000000);
    expect(result.data).to.not.equal(undefined);
    expect(_getSubmissionsFromDB.called).to.equal(true);
    expect(_getSubmissionCountsFromStore.called).to.equal(false);
  });

  it('should get full submissions from database - unknown lastUpdated date in store', async () => {
    stubGetKey.withArgs('lastUpdated').resolves(undefined);
    stubSetKey.resolves('OK');

    _getSubmissionsFromDB.resolves({
      message: 'ok',
      data: [1, 2, 3]
    });
    _getSubmissionCountsFromStore.resolves('[[1,2,3],[4,5,6]]');
    stubMeta.yields(null, { lastUpdated: 2000000 });

    const result = await subCon.queryDatabase({}, 1, false);
    
    expect(result.status).to.equal('ok');
    expect(result.message).to.equal('ok');
    expect(result.lastUpdated).to.equal(2000000);
    expect(result.data).to.not.equal(undefined);
    expect(_getSubmissionsFromDB.called).to.equal(true);
    expect(_getSubmissionCountsFromStore.called).to.equal(false);
  });

  it('should get submission counts from database', async () => {
    stubGetKey.withArgs('lastUpdated').resolves(1000000);
    stubSetKey.resolves('OK');
    _getSubmissionsFromDB.resolves({
      message: 'ok',
      data: [1, 2, 3]
    });
    _getSubmissionCountsFromStore.resolves('[[1,2,3],[4,5,6]]');
    stubMeta.yields(null, { lastUpdated: 2000000 });

    const result = await subCon.queryDatabase({}, 1, true);
    
    expect(result.status).to.equal('ok');
    expect(result.message).to.equal('ok');
    expect(result.lastUpdated).to.equal(2000000);
    expect(result.data).to.not.equal(undefined);
    expect(_getSubmissionsFromDB.called).to.equal(true);
    expect(_getSubmissionCountsFromStore.called).to.equal(false);
  });

  it('should get submission counts from store', async () => {
    stubGetKey.withArgs('lastUpdated').resolves(2000000);
    stubSetKey.resolves('OK');
    _getSubmissionsFromDB.resolves([1, 2, 3]);
    _getSubmissionCountsFromStore.resolves('[[1,2,3],[4,5,6]]');
    stubMeta.yields(null, { lastUpdated: 2000000 });

    const result = await subCon.queryDatabase({}, 1, true);
    
    expect(result.status).to.equal('ok');
    expect(result.message).to.equal('submission counts only');
    expect(result.lastUpdated).to.equal(2000000);
    expect(result.data).to.not.equal(undefined);
    expect(_getSubmissionsFromDB.called).to.equal(false);
    expect(_getSubmissionCountsFromStore.called).to.equal(true);
  });

  it('should not get submissions - database error', async () => {
    stubGetKey.withArgs('lastUpdated').resolves(1000000);
    stubSetKey.resolves('OK');
    _getSubmissionsFromDB.rejects();
    _getSubmissionCountsFromStore.resolves('[[1,2,3],[4,5,6]]');
    stubMeta.yields(null, { lastUpdated: 2000000 });

    try {
      await subCon.queryDatabase({}, 1, false);
    }

    catch (error) {
      expect(error.status).to.equal('error');
      expect(error.message).to.equal('Could not query database');
      expect(_getSubmissionsFromDB.called).to.equal(true);
      expect(_getSubmissionCountsFromStore.called).to.equal(false);
    } 
  });

  it('should not get submissions - metadata error', async () => {
    stubGetKey.withArgs('lastUpdated').resolves(1000000);
    stubSetKey.resolves('OK');
    _getSubmissionsFromDB.resolves({
      message: 'ok',
      data: [1, 2, 3]
    });
    _getSubmissionCountsFromStore.resolves('[[1,2,3],[4,5,6]]');
    stubMeta.yields({ error: 'yes '}, null);

    try {
      await subCon.queryDatabase({}, 1, false);
    }

    catch (error) {
      expect(error.status).to.equal('error');
      expect(error.message).to.equal('Could not get metadata.');
      expect(_getSubmissionsFromDB.called).to.equal(false);
      expect(_getSubmissionCountsFromStore.called).to.equal(false);
    } 
  });

  it('should get submissions despite not being able to get lastUpdated from store', async () => {
    stubGetKey.withArgs('lastUpdated').rejects();
    stubSetKey.resolves('OK');
    _getSubmissionsFromDB.resolves({
      message: 'ok',
      data: [1, 2, 3]
    });
    _getSubmissionCountsFromStore.resolves('[[1,2,3],[4,5,6]]');
    stubMeta.yields(null, { lastUpdated: 2000000 });

    const result = await subCon.queryDatabase({}, 1, false);

    expect(result.status).to.equal('ok');
    expect(result.message).to.equal('ok');
    expect(result.lastUpdated).to.equal(2000000);
    expect(result.data).to.not.equal(undefined);
    expect(_getSubmissionsFromDB.called).to.equal(true);
    expect(_getSubmissionCountsFromStore.called).to.equal(false);
  });

  it('should not get submissions - store error', async () => {
    stubGetKey.withArgs('lastUpdated').resolves(2000000);
    stubSetKey.resolves('OK');
    _getSubmissionsFromDB.resolves({
      message: 'ok',
      data: [1, 2, 3]
    });
    _getSubmissionCountsFromStore.rejects();
    stubMeta.yields(null, { lastUpdated: 2000000 });

    try {
      await subCon.queryDatabase({}, 1, true);
    }

    catch (error) {
      expect(error.status).to.equal('error');
      expect(error.message).to.equal('Could not query store');
      expect(_getSubmissionsFromDB.called).to.equal(false);
      expect(_getSubmissionCountsFromStore.called).to.equal(true);
    }
  });
});