import React, { Component } from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../../actions/index';
import firebase from '../../firebase';

class Starred extends Component {
  state = {
    starredChannels: [],
    usersRef: firebase.database().ref('users'),
    activeChannel: '',
    user: this.props.currentUser,
  };

  componentDidMount() {
    if (this.state.user) {
      this.addListeners(this.state.user.uid);
    }
  }

  componentWillUnmount() {
    this.removeListener();
  }

  removeListener = () => {
    this.state.usersRef.child(`${this.state.user.uid}/starred`).off();
  };

  addListeners = (userId) => {
    this.state.usersRef
      .child(userId)
      .child('starred')
      .on('child_added', (snap) => {
        const starredChannel = { id: snap.key, ...snap.val() };
        this.setState({
          starredChannels: [...this.state.starredChannels, starredChannel],
        });
      });

    this.state.usersRef
      .child(userId)
      .child('starred')
      .on('child_removed', (snap) => {
        const channelToRemove = { id: snap.key, ...snap.val() };
        const filteredChannels = this.state.starredChannels.filter(
          (channel) => channel.id !== channelToRemove.id
        );
        this.setState({ starredChannels: filteredChannels });
      });
  };

  setActiveChannel = (channel) => {
    this.setState({ activeChannel: channel.id });
  };

  changeChannel = (channel) => {
    this.setActiveChannel(channel);
    //this.clearNotifications(); // clear noti when leaving channel na
    this.props.setCurrentChannel(channel);
    this.props.setPrivateChannel(false);
    //this.setState({ channel });
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
          # {channel.name}
        </Menu.Item>
      ))
    );
  };

  render() {
    const { starredChannels } = this.state;
    return (
      <Menu.Menu className="menu">
        <Menu.Item>
          <span>
            <Icon name="star" /> STARRED
          </span>
          ({starredChannels.length})
        </Menu.Item>
        {this.displayChannel(starredChannels)}
      </Menu.Menu>
    );
  }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(Starred);
