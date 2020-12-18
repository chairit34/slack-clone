import React from 'react';
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { setColors } from '../../actions/index';
import {
  Sidebar,
  Divider,
  Menu,
  Button,
  Modal,
  Label,
  Icon,
  Segment,
} from 'semantic-ui-react';
import { HuePicker } from 'react-color';

class ColorPanel extends React.Component {
  state = {
    modal: false,
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    user: this.props.currentUser,
    usersRef: firebase.database().ref('users'),
    userColors: [],
  };

  componentDidMount() {
    if (this.state.user) {
      this.addListener(this.state.user.uid);
    }
  }

  componentWillUnmount() {
    this.removeListener();
  }

  removeListener = () => {
    this.state.usersRef.child(`${this.state.user.uid}/colors`).off();
  };

  addListener = (userId) => {
    let userColors = [];
    // prettier-ignore
    this.state.usersRef
      .child(`${userId}/colors`)
      .on('child_added', (snap) => {
        userColors.unshift(snap.val());
        this.setState({ userColors });
      });
  };

  displayUserColors = (colors) =>
    colors.length > 0 &&
    colors.map((color, i) => (
      <React.Fragment key={i}>
        <Divider />
        <div
          className="color_container"
          onClick={() => this.props.setColors(color.primary, color.secondary)}
        >
          <div className="color__square" style={{ background: color.primary }}>
            <div
              className="color__overlay"
              style={{ background: color.secondary }}
            ></div>
          </div>
        </div>
      </React.Fragment>
    ));

  openModal = () => this.setState({ modal: true });
  closeModal = () => this.setState({ modal: false });

  handleChangePrimary = (color) => this.setState({ primary: color.hex });
  handleChangeSecondary = (color) => this.setState({ secondary: color.hex });

  handleSaveColor = () => {
    if (this.state.primary && this.state.secondary) {
      this.saveColors(this.state.primary, this.state.secondary);
    }
  };

  saveColors = (primary, secondary) => {
    this.state.usersRef
      .child(`${this.state.user.uid}/colors`)
      .push()
      .update({
        primary,
        secondary,
      })
      .then(() => {
        console.log('Color added');
        this.closeModal();
      })
      .catch((err) => console.error(err));
  };

  render() {
    const { modal, primary, secondary, userColors } = this.state;
    return (
      <Sidebar
        as={Menu}
        icon="labeled"
        inverted
        vertical
        visible
        width="very thin"
      >
        <Divider />
        <Button onClick={this.openModal} icon="add" size="small" color="blue" />
        {this.displayUserColors(userColors)}
        {/* Color picker modal */}
        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header> Choose App Colors</Modal.Header>
          <Modal.Content>
            <Segment inverted>
              <Label content="Primary Color" />
              <HuePicker color={primary} onChange={this.handleChangePrimary} />
            </Segment>
            <Segment inverted>
              <Label content="Secondary Color" />
              <HuePicker
                color={secondary}
                onChange={this.handleChangeSecondary}
              />
            </Segment>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.handleSaveColor} color="green" inverted>
              <Icon name="checkmark" /> Save Colors
            </Button>
            <Button color="red" inverted onClick={this.closeModal}>
              <Icon name="remove" /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </Sidebar>
    );
  }
}

export default connect(null, { setColors })(ColorPanel);
