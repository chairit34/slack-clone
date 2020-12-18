import React, { Component } from 'react';
import {
  Form,
  Icon,
  Menu,
  Modal,
  Button,
  Input,
  Label,
} from 'semantic-ui-react';
import firebase from '../../firebase';
import { setCurrentChannel, setPrivateChannel } from '../../actions/index';
import { connect } from 'react-redux';

class Channels extends Component {
  state = {
    activeChannel: '',
    user: this.props.currentUser,
    channel: null,
    channels: [],
    channelName: '',
    channelDetail: '',
    channelsRef: firebase.database().ref('channels'),
    messagesRef: firebase.database().ref('messages'),
    typingRef: firebase.database().ref('typing'),
    notifications: [],
    modal: false,
    firstLoad: true,
  };
  openModal = () => {
    this.setState({ modal: true });
  };
  closeModal = () => {
    this.setState({ modal: false });
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  componentDidMount() {
    this.addListeners();
  }
  componentWillUnMount() {
    this.removeListeners();
  }

  addListeners = () => {
    let loadedChannels = [];
    this.state.channelsRef.on('child_added', (snap) => {
      //console.log(' on channels added');
      loadedChannels.push(snap.val());
      this.setState({ channels: loadedChannels });
      this.setFirstChannel();
      this.addNotificationListener(snap.key);
    });
  };

  addNotificationListener = (channelId) => {
    this.state.messagesRef.child(channelId).on('value', (snap) => {
      //console.log('on value change of each channel in messages'); called once
      if (this.state.channel) {
        // channelId is the id of each channel, current clicked channel id, notification state, inside each channel in database
        this.handleNotifications(
          channelId,
          this.state.channel.id,
          this.state.notifications,
          snap
        );
      }
    });
  };

  handleNotifications = (channelId, currentChannelId, notifications, snap) => {
    // data structure, total=last read total,  lastKnownTotal is real total, count is diff
    let lastTotal = 0;
    let index = notifications.findIndex(
      (notification) => notification.id === channelId
    );
    if (index !== -1) {
      // found in notifications array
      if (channelId !== currentChannelId) {
        lastTotal = notifications[index].total; // retreive total from array
        if (snap.numChildren() - lastTotal > 0) {
          notifications[index].count = snap.numChildren() - lastTotal;
        }
      }
      notifications[index].lastKnownTotal = snap.numChildren();
    } else {
      // cannot find in notification

      notifications.push({
        id: channelId,
        total: snap.numChildren(),
        lastKnownTotal: snap.numChildren(),
        count: 0,
      });
    }
    this.setState({ notifications });
  };

  removeListeners = () => {
    this.state.channelsRef.off();
    this.state.channels.forEach((channel) => {
      this.state.messagesRef.chile(channel.id).off();
    });
  };

  setFirstChannel = () => {
    const firstChannel = this.state.channels[0];
    if (this.state.firstLoad && this.state.channels.length > 0) {
      this.props.setCurrentChannel(firstChannel);
      this.setActiveChannel(firstChannel);
      this.setState({ channel: firstChannel });
    }
    this.setState({ firstLoad: false });
  };

  addChannel = () => {
    const { channelsRef, channelName, channelDetail, user } = this.state;
    const key = channelsRef.push().key;
    const newChannel = {
      id: key,
      name: channelName,
      detail: channelDetail,
      createdBy: {
        name: user.displayName,
        avatar: user.photoURL,
      },
    };
    channelsRef
      .child(key)
      .update(newChannel)
      .then(() => {
        this.setState({ channelName: '', channelDetail: '' });
        this.closeModal();
        console.log('channel added');
      })
      .catch((err) => {
        console.error(err);
      });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    if (this.isFormValid(this.state)) {
      this.addChannel();
    }
  };

  getNotificationCount = (channel) => {
    let count = 0;
    this.state.notifications.forEach((notification) => {
      if (notification.id === channel.id) {
        count = notification.count;
      }
    });
    if (count > 0) return count;
  };

  displayChannel = (channels) => {
    return (
      channels.length > 0 &&
      channels.map((channel) => (
        <Menu.Item
          key={channel.id}
          onClick={() => this.changeChannel(channel)}
          name={channel.name}
          style={{ opacity: 0.7 }}
          active={channel.id === this.state.activeChannel}
        >
          {this.getNotificationCount(channel) && (
            <Label color="red">{this.getNotificationCount(channel)}</Label>
          )}
          # {channel.name}
        </Menu.Item>
      ))
    );
  };

  changeChannel = (channel) => {
    this.setActiveChannel(channel);
    this.state.typingRef
      .child(this.state.channel.id)
      .child(this.state.user.uid)
      .remove();
    this.clearNotifications(); // clear noti when leaving channel na
    this.props.setCurrentChannel(channel);
    this.props.setPrivateChannel(false);
    this.setState({ channel });
  };

  clearNotifications = () => {
    let index = this.state.notifications.findIndex(
      (notification) => notification.id === this.state.channel.id
    );
    if (index !== -1) {
      let updatedNotifications = [...this.state.notifications];
      // prettier-ignore
      updatedNotifications[index].total = this.state.notifications[index].lastKnownTotal;
      updatedNotifications[index].count = 0;
      this.setState({ notifications: updatedNotifications });
    }
  };

  setActiveChannel = (channel) => {
    this.setState({ activeChannel: channel.id });
  };

  isFormValid = ({ channelName, channelDetail }) =>
    channelName && channelDetail;

  render() {
    const { channels, modal } = this.state;
    return (
      <React.Fragment>
        <Menu.Menu className="menu">
          <Menu.Item>
            <span>
              <Icon name="exchange" /> CHANNELS
            </span>
            {'  '}({channels.length}){' '}
            <Icon
              style={{ cursor: 'pointer' }}
              name="add"
              onClick={this.openModal}
            />
          </Menu.Item>
          {/* Channels */}
          {this.displayChannel(channels)}
        </Menu.Menu>

        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header>Add a Channel</Modal.Header>
          <Modal.Content>
            <Form.Field>
              <Input
                fluid
                label="Name of Chanel"
                name="channelName"
                onChange={this.handleChange}
              />

              <Input
                fluid
                style={{ marginTop: '1em' }}
                label="About the channel"
                name="channelDetail"
                onChange={this.handleChange}
              />
            </Form.Field>
            <Form.Field></Form.Field>
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" inverted onClick={this.handleSubmit}>
              <Icon name="checkmark" /> Add
            </Button>
            <Button color="red" inverted onClick={this.closeModal}>
              <Icon name="remove" /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(
  Channels
);
