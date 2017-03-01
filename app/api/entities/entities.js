//import {updateMetadataNames, deleteMetadataProperties} from 'api/entities/utils';
import date from 'api/utils/date.js';
import search from 'api/search/search';
import settings from '../settings';
import references from '../references/references';
import templates from '../templates';
import ID from 'shared/uniqueID';

import model from './entitiesModel';

const validate = (doc) => {
  return model.getById(doc._id)
  .then((previousDoc) => {
    if (!doc.template) {
      return Promise.resolve();
    }
    if (doc.template.toString() === previousDoc.template.toString()) {
      return Promise.resolve();
    }

    return templates.get({'properties.content': previousDoc.template})
    .then((allTemplates) => {
      const allProperties = allTemplates.reduce((m, t) => m.concat(t.properties), []);
      let query = {$or: []};
      query.$or = allProperties.filter(p => p.content && previousDoc.template.equals(p.content))
      .map((property) => {
        let p = {};
        p[`metadata.${property.name}`] = doc.sharedId;
        return p;
      });

      return model.count(query);
    })
    .then((beingUsed) => {
      if (beingUsed) {
        return Promise.reject('entity being used as thesauri, can not change template');
      }
      return Promise.resolve();
    });
  });
};

export default {
  save(doc, {user, language}) {
    if (!doc.sharedId) {
      doc.user = user._id;
      doc.creationDate = date.currentUTC();
      doc.published = false;
    }

    if (!doc.type) {
      doc.type = 'entity';
    }

    const sharedId = doc.sharedId || ID();
    return validate(doc)
    .then(() => settings.get())
    .then(({languages}) => {
      if (doc.sharedId) {
        return Promise.all([
          this.getAllLanguages(doc.sharedId),
          templates.getById(doc.template)
        ])
        .then(([docLanguages, templateResult]) => {
          const template = templateResult || {properties: []};
          const toSyncProperties = template.properties.filter(p => p.type.match('select|multiselect|date|multidate|multidaterange')).map(p => p.name);
          const docs = docLanguages.map((d) => {
            if (d._id.equals(doc._id)) {
              return doc;
            }
            if (!d.metadata) {
              d.metadata = doc.metadata;
            }
            toSyncProperties.forEach((p) => {
              d.metadata[p] = doc.metadata[p];
            });
            d.published = doc.published;
            d.template = doc.template;
            return d;
          });

          return Promise.all(docs.map(d => {
            return model.save(d)
            .then((_d) => {
              return search.index(_d);
            });
          }));
        });
      }

      const docs = languages.map((lang) => {
        let langDoc = Object.assign({}, doc);
        langDoc.language = lang.key;
        langDoc.sharedId = sharedId;
        return langDoc;
      });

      return model.save(docs).then((savedDocs) => Promise.all(savedDocs.map((d) => search.index(d))));
    })
    .then(() => this.getById(sharedId, language))
    .then(response => {
      return Promise.all([response, references.saveEntityBasedReferences(response, language)]);
    })
    .then(([entity]) => {
      return entity;
    });
  },

  get(query, select, pagination) {
    return model.get(query, select, pagination);
  },

  getById(sharedId, language) {
    if (!language) {
      return model.getById(sharedId);
    }

    return model.get({sharedId, language}).then((result) => result[0]);
  },

  saveMultiple(docs) {
    return model.save(docs)
    .then((response) => {
      Promise.all(docs.map((d) => search.index(d)));
      return response;
    });
  },

  getAllLanguages(sharedId) {
    return model.get({sharedId});
  },

  countByTemplate(template) {
    return model.count({template});
  },

  getByTemplate(template, language) {
    return model.get({template, language});
  },

  updateMetadataProperties(template, nameMatches, deleteProperties) {
    let actions = {};
    actions.$rename = nameMatches;
    if (deleteProperties) {
      let toUnset = {};
      deleteProperties.forEach(p => toUnset[p] = '');
      actions.$unset = toUnset;
    }
    return model.db.updateMany({template}, actions);
  },

  delete(sharedId) {
    return this.get({sharedId})
    .then((docs) => {
      return Promise.all([
        model.delete({sharedId}),
        references.delete({$or: [{targetDocument: sharedId}, {sourceDocument: sharedId}]})
      ])
      .then(() => docs);
    })
    .then((docs) => {
      return Promise.all(docs.map((doc) => {
        return search.delete(doc);
      }))
      .then(() => docs);
    });
  }
};
