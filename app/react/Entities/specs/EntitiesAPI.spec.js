import entitiesAPI from '../EntitiesAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('EntitiesAPI', () => {
  let arrayResponse = [{entities: 'array'}];
  let searchResponse = [{entities: 'search'}];
  let filteredSearchResult = [{entities: 'Alfred'}];
  let singleResponse = [{entities: 'single'}];

  beforeEach(() => {
    backend.restore();
    backend
    .get(APIURL + 'entities', {body: JSON.stringify({rows: arrayResponse})})
    .get(APIURL + 'entities/search', {body: JSON.stringify(searchResponse)})
    .get(APIURL + 'entities/uploads', {body: JSON.stringify({rows: 'uploads'})})
    .get(APIURL + 'entities/count_by_template?templateId=templateId', {body: JSON.stringify(1)})
    .get(APIURL + 'entities/match_title?searchTerm=term', {body: JSON.stringify(searchResponse)})
    .get(APIURL + 'entities/search?searchTerm=Batman&joker=true', {body: JSON.stringify(filteredSearchResult)})
    .get(APIURL + 'entities?_id=documentId', {body: JSON.stringify({rows: singleResponse})})
    .delete(APIURL + 'entities?_id=id', {body: JSON.stringify({backednResponse: 'testdelete'})})
    .post(APIURL + 'entities', {body: JSON.stringify({backednResponse: 'test'})});
  });

  afterEach(() => backend.restore());

  describe('uploads', () => {
    it('should request uploads', (done) => {
      entitiesAPI.uploads()
      .then((response) => {
        expect(response).toEqual('uploads');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('get()', () => {
    it('should request entities', (done) => {
      entitiesAPI.get()
      .then((response) => {
        expect(response).toEqual(arrayResponse);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing an id', () => {
      it('should request for the thesauri', (done) => {
        entitiesAPI.get('documentId')
        .then((response) => {
          expect(response).toEqual(singleResponse);
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('getSuggestions()', () => {
    it('should match_title ', (done) => {
      entitiesAPI.getSuggestions('term')
      .then((response) => {
        expect(response).toEqual(searchResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('countByTemplate()', () => {
    it('should count_by_template', (done) => {
      entitiesAPI.countByTemplate('templateId')
      .then((response) => {
        expect(response).toEqual(1);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search entities', (done) => {
      entitiesAPI.search()
      .then((response) => {
        expect(response).toEqual(searchResponse);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing filters', () => {
      it('should search for it', (done) => {
        entitiesAPI.search({searchTerm: 'Batman', joker: true})
        .then((response) => {
          expect(response).toEqual(filteredSearchResult);
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('save()', () => {
    it('should post the document data to /entities', (done) => {
      let data = {name: 'document name'};
      entitiesAPI.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'entities').body)).toEqual(data);
        expect(response).toEqual({backednResponse: 'test'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', (done) => {
      let document = {_id: 'id'};
      entitiesAPI.delete(document)
      .then((response) => {
        expect(response).toEqual({backednResponse: 'testdelete'});
        done();
      })
      .catch(done.fail);
    });
  });
});
