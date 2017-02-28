import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';

import ContextMenu from 'app/ContextMenu';

import {enterUploads} from '../actions/uploadsActions';

import UploadBox from './UploadBox';
import UploadsList from './UploadsList';
import UploadsFormPanel from './UploadsFormPanel';
import UploadFailedModal from './UploadFailedModal';
import UploadsMenu from './UploadsMenu';
import ReadyToPublishModal from './ReadyToPublishModal';
import {t} from 'app/I18N';

import io from 'socket.io-client';

export class UploadsSection extends Component {

  componentDidMount() {
    this.context.store.dispatch(enterUploads());
  }

  componentWillMount() {
    this.socket = io();
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  render() {
    let className = '';
    if (this.props.panelIsOpen) {
      className = ' with-panel is-active';
    }
    return (
      <div className="row">
        <Helmet title={t('System', 'Uploads')}/>
        <div className={'section-header' + className}>
          <h1>My files</h1>
          <div className="pull-right">
            <button className="btn btn-success btn-xs">
              <i className="fa fa-upload"></i> <span>Upload </span><span className="show-mobile">documents</span>
            </button>
            <button className="btn btn-success btn-xs">
              <i className="fa fa-plus"></i> <span>New </span><span className="show-mobile">entity</span>
            </button>
          </div>
        </div>
        <main className={'document-viewer' + className}>
          <UploadBox />
          <UploadsList socket={this.socket}/>
        </main>
        <UploadsFormPanel />
        <UploadFailedModal />
        <ReadyToPublishModal />
      </div>
    );
  }
}

UploadsSection.propTypes = {
  panelIsOpen: PropTypes.bool,
  targetDocument: PropTypes.bool
};

UploadsSection.contextTypes = {
  store: PropTypes.object
};

const mapStateToProps = (state) => {
  let uiState = state.uploads.uiState.toJS();
  return {
    panelIsOpen: !!uiState.metadataBeingEdited
  };
};

export default connect(mapStateToProps)(UploadsSection);
