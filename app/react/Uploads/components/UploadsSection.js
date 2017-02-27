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
    let className = 'document-viewer';
    if (this.props.panelIsOpen) {
      className = 'document-viewer with-panel is-active';
    }
    return (
      <div className="row">
        <Helmet title={t('System', 'Uploads')}/>
        <header className="uploadsHeader">
          <span>My files</span>
          <div className="pull-right">
            <button className="btn btn-success btn-xs">
              <i className="fa fa-upload"></i>Upload documents</button>
            <button className="btn btn-success btn-xs">
              <i className="fa fa-plus"></i>Create entity</button>
          </div>
        </header>
        <main className={className}>
          <div className="sort-by">
            <div className="u-floatLeft documents-counter">
              <b>20</b> documentos
            </div>
            <div className="Dropdown order-by u-floatRight ">
              <ul className="Dropdown-list">
                <li className="Dropdown-option is-active"><a className="Dropdown-option__item is-active">Title (A-Z)</a></li>
              </ul>
            </div>
          </div>
          <UploadBox />
          <UploadsList socket={this.socket}/>
        </main>
        <UploadsFormPanel />
        <UploadFailedModal />
        <ReadyToPublishModal />

        <ContextMenu>
          <UploadsMenu />
        </ContextMenu>
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
