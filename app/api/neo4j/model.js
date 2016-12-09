import query from './query';
import ID from 'shared/uniqueID';

export default (type) => {
  function processRecord(_record) {
    return _record.toObject().props;
  }

  return {
    get: () => {
      return query(`MATCH (n:${type}) RETURN properties(n) as props`)
      .then((response) => {
        return {
          rows: response.records.map(processRecord)
        };
      });
    },
    save: (props) => {
      props.id = props.id || ID();
      return query(`MERGE (n:${type} {id: {props}.id}) SET n = {props} RETURN properties(n) AS props`, {props})
      .then((response) => {
        return processRecord(response.records[0]);
      });
    }
  };
};
