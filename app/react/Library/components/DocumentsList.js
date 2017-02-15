import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {createSelector} from 'reselect';

import DocumentsList from 'app/Layout/DocumentsList';
import {loadMoreDocuments} from 'app/Library/actions/libraryActions';

const selectDocuments = createSelector(s => s.library.documents, d => d.toJS());

export function mapStateToProps(state) {
  return {
    documents: selectDocuments(state),
    filters: state.library.filters,
    filtersPanel: state.library.ui.get('filtersPanel'),
    selectedDocument: state.library.ui.get('selectedDocument'),
    search: state.search
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadMoreDocuments, searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
