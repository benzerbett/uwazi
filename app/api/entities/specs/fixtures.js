import {db} from 'api/utils';

const batmanFinishesId = db.id();
const syncPropertiesEntityId = db.id();
const templateId = db.id();
const templateWithThesauriId = db.id();
const templateWithThesauriId2 = db.id();
const templateChangingNames = db.id();
const referenceId = db.id();

export default {
  entities: [
    {_id: batmanFinishesId, sharedId: 'shared', type: 'entity', template: templateId, language: 'en', title: 'Batman finishes', published: true, metadata: {property1: 'value1'}},
    {_id: db.id(), sharedId: 'shared', type: 'entity', language: 'es', title: 'Penguin almost done', creationDate: 1, published: true},
    {
      _id: db.id(), sharedId: 'shared', type: 'entity', language: 'pt', title: 'Penguin almost done', creationDate: 1, published: true, metadata: {text: 'test'}
    },
    //select/multiselect/date sync
    {_id: syncPropertiesEntityId, template: templateId, sharedId: 'shared1', type: 'entity', language: 'en', title: 'EN', published: true, metadata: {text: 'text'}},
    {_id: db.id(), template: templateId, sharedId: 'shared1', type: 'entity', language: 'es', title: 'ES', creationDate: 1, published: true, metadata: {text: 'text'}},
    {_id: db.id(), template: templateId, sharedId: 'shared1', type: 'entity', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: {text: 'text'}},
    //docs to change metadata property names
    {_id: db.id(), template: templateChangingNames, sharedId: 'shared10', type: 'entity', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: {property1: 'value1', property2: 'value2', property3: 'value3'}},
    {_id: db.id(), template: templateChangingNames, sharedId: 'shared10', type: 'entity', language: 'pt', title: 'PT', creationDate: 1, published: true, metadata: {property1: 'value1', property2: 'value2', property3: 'value3'}},
    //entity using another entity as thesauri value
    {_id: db.id(), template: templateWithThesauriId2, sharedId: 'newId', type: 'entity', language: 'en', title: 'using batman as thesauri', creationDate: 1, published: true, metadata: {thesauri2: 'another_shared'}},
    {_id: db.id(), template: templateWithThesauriId, sharedId: 'newId', type: 'entity', language: 'en', title: 'using batman as thesauri', creationDate: 1, published: true, metadata: {thesauri: 'shared'}}
  ],
  settings: [
    {_id: db.id(), languages: [{key: 'es'}, {key: 'pt'}, {key: 'en'}]}
  ],
  templates: [
    {_id: templateId, name: 'template_test', properties: [
      {type: 'text', name: 'text'},
      {type: 'select', name: 'select'},
      {type: 'multiselect', name: 'multiselect'},
      {type: 'date', name: 'date'},
      {type: 'multidate', name: 'multidate'},
      {type: 'multidaterange', name: 'multidaterange'}
    ]},
    {_id: templateChangingNames, name: 'template_changing_names', properties: [
      {type: 'text', name: 'property1'},
      {type: 'text', name: 'property2'},
      {type: 'text', name: 'property3'}
    ]},
    {_id: templateWithThesauriId2, name: 'templateWithThesauriId', properties: [
      {type: 'select', name: 'thesauri2', content: templateId.toString()}
    ]},
    {_id: templateWithThesauriId, name: 'templateWithThesauriId', properties: [
      {type: 'select', name: 'thesauri', content: templateId.toString()}
    ]}
  ],
  connections: [
    {_id: referenceId, title: 'reference1', sourceDocument: 'shared', relationtype: 'relation1'},
    {_id: db.id(), title: 'reference2', sourceDocument: 'source2', relationtype: 'relation2', targetDocument: 'shared'},
    {_id: db.id(), title: 'reference3', sourceDocument: 'another', relationtype: 'relation3', targetDocument: 'document'}
  ]
};

export {
  batmanFinishesId,
  syncPropertiesEntityId,
  templateId,
  templateChangingNames
};
