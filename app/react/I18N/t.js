import {store} from 'app/store';

let t = (contextId, key, _text) => {
  let text = _text || key;
  let state = store.getState();
  let translations = state.translations.toJS();
  let translation = translations.find((d) => d.locale === state.locale) || {contexts: []};
  let context = translation.contexts.find((ctx) => ctx.id === contextId) || {values: {}};

  if (contextId === 'System' && !context.values[key]) {
    console.error(`"${key}" (${text})  key does not exist, configure it on /api/i18n/systemKeys.js`); // eslint-disable-line
  }

  return context.values[key] || text;
};

export default t;
