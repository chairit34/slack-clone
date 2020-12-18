import React, { Component } from 'react';
import { Modal, Input, Icon, Button } from 'semantic-ui-react';
import mime from 'mime-types';

export default class FileModal extends Component {
  state = {
    file: null,
    authorized: ['image/jpeg', 'image/png'],
  };

  addFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      this.setState({ file });
    }
  };

  sendFile = () => {
    const { file } = this.state;
    const { uploadFile, closeModal } = this.props;
    if (file !== null) {
      if (this.isAuthorized(file.name)) {
        const metadata = { contentType: mime.lookup(file.name) };
        uploadFile(file, metadata);
        this.clearFile();
        closeModal();
      }
    }
  };

  clearFile = () => this.setState({ file: null });

  isAuthorized = (filename) => this.state.authorized.includes(mime.lookup(filename));

  render() {
    const { modal, closeModal } = this.props;
    return (
      <Modal basic open={modal} onClose={closeModal}>
        <Modal.Header>Select an Image File</Modal.Header>
        <Modal.Content>
          <Input onChange={this.addFile} fluid label="File types: jpg, png" name="file" type="file" />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.sendFile} color="green" inverted>
            <Icon name="checkmark" />
            Send
          </Button>
          <Button onClick={closeModal} color="red" inverted>
            <Icon name="remove" />
            Cancel
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}