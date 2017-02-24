import {db_url as dbURL} from 'api/config/database.js';
import fs from 'fs';
import entities from '../entities.js';
import request from 'shared/JSONRequest';
import {catchErrors} from 'api/utils/jasmineHelpers';
import date from 'api/utils/date.js';
import search from 'api/search/search';
import references from 'api/references';

import fixtures, {batmanFinishesId, templateId, syncPropertiesEntityId} from './fixtures.js';
import {db} from 'api/utils';

describe('entities', () => {
  beforeEach((done) => {
    spyOn(references, 'saveEntityBasedReferences').and.returnValue(Promise.resolve());
    spyOn(search, 'index').and.returnValue(Promise.resolve());
    spyOn(search, 'delete').and.returnValue(Promise.resolve());
    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
  });

  describe('save', () => {
    it('should create a new entity for each language in settings with a language property and a shared id', (done) => {
      const universalTime = 1;
      spyOn(date, 'currentUTC').and.returnValue(universalTime);
      let doc = {title: 'Batman begins'};
      let user = {_id: db.id()};

      entities.save(doc, {user, language: 'es'})
      .then(() => entities.get())
      .then((docs) => {
        let createdDocumentEs = docs.find((d) => d.title === 'Batman begins' && d.language === 'es');
        let createdDocumentEn = docs.find((d) => d.title === 'Batman begins' && d.language === 'en');

        expect(createdDocumentEs.sharedId).toBe(createdDocumentEn.sharedId);

        expect(createdDocumentEs.title).toBe(doc.title);
        expect(createdDocumentEs.user.equals(user._id)).toBe(true);
        expect(createdDocumentEs.type).toBe('entity');
        expect(createdDocumentEs.published).toBe(false);
        expect(createdDocumentEs.creationDate).toEqual(universalTime);

        expect(createdDocumentEn.title).toBe(doc.title);
        expect(createdDocumentEn.user.equals(user._id)).toBe(true);
        expect(createdDocumentEn.type).toBe('entity');
        expect(createdDocumentEn.published).toBe(false);
        expect(createdDocumentEn.creationDate).toEqual(universalTime);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the newly created document for the passed language', (done) => {
      let doc = {title: 'the dark knight', fullText: 'the full text!'};
      let user = {_id: db.id()};

      entities.save(doc, {user, language: 'en'})
      .then((createdDocument) => {
        expect(createdDocument._id).toBeDefined();
        expect(createdDocument.title).toBe(doc.title);
        expect(createdDocument.user.equals(user._id)).toBe(true);
        expect(createdDocument.language).toEqual('en');
        expect(createdDocument.fullText).not.toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should index the newly created documents', (done) => {
      let doc = {title: 'the dark knight'};
      let user = {_id: db.id()};

      entities.save(doc, {user, language: 'en'})
      .then(() => {
        expect(search.index.calls.all()[0].args[0].language).toBe('es');
        expect(search.index.calls.all()[0].args[0]._id).toBeDefined();
        expect(search.index.calls.all()[1].args[0].language).toBe('pt');
        expect(search.index.calls.all()[2].args[0].language).toBe('en');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when other languages have no metadata', () => {
      it('should replicate metadata being saved', (done) => {
        let doc = {_id: batmanFinishesId, sharedId: 'shared', metadata: {text: 'newMetadata'}, template: templateId};

        entities.save(doc, {language: 'en'})
        .then((updatedDoc) => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([
            entities.getById('shared', 'es'),
            entities.getById('shared', 'en'),
            entities.getById('shared', 'pt')
          ]);
        })
        .then(([docES, docEN, docPT]) => {
          expect(docEN.metadata.text).toBe('newMetadata');
          expect(docES.metadata.text).toBe('newMetadata');
          expect(docPT.metadata.text).toBe('test');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when published/template property changes', () => {
      it('should replicate the change for all the languages', (done) => {
        let doc = {_id: batmanFinishesId, sharedId: 'shared', metadata: {}, published: false, template: templateId};

        entities.save(doc, {language: 'en'})
        .then((updatedDoc) => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([
            entities.getById('shared', 'es'),
            entities.getById('shared', 'en')
          ]);
        })
        .then(([docES, docEN]) => {
          expect(docES.published).toBe(false);
          expect(docES.template.equals(templateId)).toBe(true);
          expect(docEN.published).toBe(false);
          expect(docEN.template.equals(templateId)).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    it('should sync select/multiselect/dates/multidate/multidaterange', (done) => {
      let doc = {_id: syncPropertiesEntityId, sharedId: 'shared1', template: templateId, metadata: {
        text: 'changedText',
        select: 'select',
        multiselect: 'multiselect',
        date: 'date',
        multidate: 'multidate',
        multidaterange: 'multidaterange'
      }};

      entities.save(doc, {language: 'en'})
      .then((updatedDoc) => {
        expect(updatedDoc.language).toBe('en');
        return Promise.all([
          entities.getById('shared1', 'en'),
          entities.getById('shared1', 'es'),
          entities.getById('shared1', 'pt')
        ]);
      })
      .then(([docEN, docES, docPT]) => {
        expect(docEN.metadata.text).toBe('changedText');
        expect(docEN.metadata.select).toBe('select');
        expect(docEN.metadata.multiselect).toBe('multiselect');
        expect(docEN.metadata.date).toBe('date');
        expect(docEN.metadata.multidate).toBe('multidate');
        expect(docEN.metadata.multidaterange).toBe('multidaterange');

        expect(docES.metadata.text).toBe('text');
        expect(docES.metadata.select).toBe('select');
        expect(docES.metadata.multiselect).toBe('multiselect');
        expect(docES.metadata.date).toBe('date');
        expect(docES.metadata.multidate).toBe('multidate');
        expect(docES.metadata.multidaterange).toBe('multidaterange');

        expect(docPT.metadata.text).toBe('text');
        expect(docPT.metadata.select).toBe('select');
        expect(docPT.metadata.multiselect).toBe('multiselect');
        expect(docPT.metadata.date).toBe('date');
        expect(docPT.metadata.multidate).toBe('multidate');
        expect(docPT.metadata.multidaterange).toBe('multidaterange');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should saveEntityBasedReferences', (done) => {
      spyOn(date, 'currentUTC').and.returnValue(1);
      let doc = {title: 'Batman begins'};
      let user = {_id: db.id()};

      entities.save(doc, {user, language: 'es'})
      .then(() => {
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0].title).toBe('Batman begins');
        expect(references.saveEntityBasedReferences.calls.argsFor(0)[0]._id).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when document have _id', () => {
      it('should not assign again user and creation date', (done) => {
        spyOn(date, 'currentUTC').and.returnValue(10);
        let modifiedDoc = {_id: batmanFinishesId, sharedId: 'shared'};
        return entities.save(modifiedDoc, {user: 'another_user', language: 'en'})
        .then(() => entities.getById('shared', 'en'))
        .then((doc) => {
          expect(doc.user).not.toBe('another_user');
          expect(doc.creationDate).not.toBe(10);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('get', () => {
    it('should return matching entities for the conditions', (done) => {
      let sharedId = 'shared1';

      Promise.all([
        entities.get({sharedId, language: 'en'}),
        entities.get({sharedId, language: 'es'})
      ])
      .then(([enDoc, esDoc]) => {
        expect(enDoc[0].title).toBe('EN');
        expect(esDoc[0].title).toBe('ES');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('countByTemplate', () => {
    it('should return how many entities using the template passed', (done) => {
      entities.countByTemplate(templateId)
      .then((count) => {
        expect(count).toBe(4);
        done();
      })
      .catch(done.fail);
    });

    it('should return 0 when no count found', (done) => {
      entities.countByTemplate(db.id())
      .then((count) => {
        expect(count).toBe(0);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('getByTemplate', () => {
    it('should return all entities with passed template and language', (done) => {
      entities.getByTemplate(templateId, 'en')
      .then((docs) => {
        expect(docs.length).toBe(2);
        expect(docs[0].title).toBe('Batman finishes');
        expect(docs[1].title).toBe('EN');
        done();
      })
      .catch(done.fail);
    });
  });

  /// not used right now but it needs to be improved and used
  describe('updateMetadataProperties', () => {
    let getDocumentsByTemplate = (template) => request.get(dbURL + '/_design/entities/_view/metadata_by_template?key="' + template + '"')
    .then((response) => {
      return response.json.rows.map((r) => r.value);
    });

    xit('should update metadata property names on the entities matching the template', (done) => {
      let nameChanges = {property1: 'new_name1', property2: 'new_name2'};
      entities.updateMetadataProperties('template1', nameChanges)
      .then(() => getDocumentsByTemplate('template1'))
      .then((docs) => {
        expect(docs[0].metadata.new_name1).toBe('value1');
        expect(docs[0].metadata.new_name2).toBe('value2');
        expect(docs[0].metadata.property3).toBe('value3');

        expect(docs[1].metadata.new_name1).toBe('value1');
        expect(docs[1].metadata.new_name2).toBe('value2');
        expect(docs[1].metadata.property3).toBe('value3');
        done();
      })
      .catch(done.fail);
    });

    xit('should delete properties passed', (done) => {
      let nameChanges = {property2: 'new_name'};
      let deleteProperties = ['property1', 'property3'];
      entities.updateMetadataProperties('template1', nameChanges, deleteProperties)
      .then(() => getDocumentsByTemplate('template1'))
      .then((docs) => {
        expect(docs[0].metadata.property1).not.toBeDefined();
        expect(docs[0].metadata.new_name).toBe('value2');
        expect(docs[0].metadata.property2).not.toBeDefined();
        expect(docs[0].metadata.property3).not.toBeDefined();

        expect(docs[1].metadata.property1).not.toBeDefined();
        expect(docs[1].metadata.new_name).toBe('value2');
        expect(docs[1].metadata.property2).not.toBeDefined();
        expect(docs[1].metadata.property3).not.toBeDefined();
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      fs.writeFileSync('./uploaded_documents/8202c463d6158af8065022d9b5014ccb.pdf');
      fs.writeFileSync('./uploaded_documents/8202c463d6158af8065022d9b5014cc1.pdf');
    });

    it('should delete the document in the database', (done) => {
      entities.delete('shared')
      .then(() => entities.get({sharedId: 'shared'}))
      .then((response) => {
        expect(response.length).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the document from the search', (done) => {
      return entities.delete('shared')
      .then(() => {
        const argumnets = search.delete.calls.allArgs();
        expect(search.delete).toHaveBeenCalled();
        expect(argumnets[0][0]._id.toString()).toBe(batmanFinishesId.toString());
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the document references', (done) => {
      return entities.delete('shared')
      .then(() => references.get())
      .then((refs) => {
        expect(refs.length).toBe(1);
        expect(refs[0].title).toBe('reference3');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the original file', (done) => {
      entities.delete('shared')
      .then(() => {
        expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014ccb.pdf')).toBe(false);
        expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014cc1.pdf')).toBe(false);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('deleteMultiple()', () => {
    it('should delete() all the given entities', (done) => {
      spyOn(entities, 'delete').and.returnValue(Promise.resolve());
      entities.deleteMultiple(['id1', 'id2'])
      .then(() => {
        expect(entities.delete).toHaveBeenCalledWith('id1');
        expect(entities.delete).toHaveBeenCalledWith('id2');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
