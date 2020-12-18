import React from 'react';
import { Segment, Comment } from 'semantic-ui-react';
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { setUserPosts } from '../../actions/index';

import MessagesHeader from './MessagesHeader';
import MessageForm from './MessageForm';
import Message from './Message';
import Typing from './Typing';
import Skeleton from './Skeleton';

class Messages extends React.Component {
  state = {
    isPrivateChannel: this.props.isPrivateChannel,
    messagesRef: firebase.database().ref('messages'),
    privateMessagesRef: firebase.database().ref('privateMessages'),
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    usersRef: firebase.database().ref('users'),
    isChannelStarred: false,
    messages: [],
    messagesLoading: true,
    numUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    searchResults: [],
    typingRef: firebase.database().ref('typing'),
    typingUsers: [],
    connectedRef: firebase.database().ref('.info/connected'),
    listeners: [],
  };

  getMessagesRef = () => {
    const { messagesRef, privateMessagesRef, isPrivateChannel } = this.state;
    return isPrivateChannel ? privateMessagesRef : messagesRef;
  };

  handleStar = () => {
    this.setState(
      (prevState) => ({
        isChannelStarred: !prevState.isChannelStarred,
      }),
      () => this.starChannel()
    );
  };

  starChannel = () => {
    if (this.state.isChannelStarred) {
      this.state.usersRef.child(`${this.state.user.uid}/starred`).update({
        [this.state.channel.id]: {
          name: this.state.channel.name,
          detail: this.state.channel.detail,
          createdBy: {
            name: this.state.channel.createdBy.name,
            avatar: this.state.channel.createdBy.avatar,
          },
        },
      });
    } else {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .child(this.state.channel.id)
        .remove((err) => {
          if (err !== null) {
            console.error(err);
          }
        });
    }
  };

  componentDidMount() {
    const { channel, user, listeners } = this.state;
    // starting
    if (channel && user) {
      this.removeListeners(listeners);
      this.addListener(channel.id);
      this.addUserStarsListener(channel.id, user.uid); // Called only once
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.messagesEnd) {
      this.scrollToBottom();
    }
  }

  componentWillUnmount() {
    this.removeListeners(this.state.listeners);
    this.state.connectedRef.off();
  }

  addToListeners = (id, ref, event) => {
    const index = this.state.listeners.findIndex((listener) => {
      return (
        listener.id === id && listener.ref === ref && listener.event === event
      );
    });

    if (index === -1) {
      const newListener = { id, ref, event };
      this.setState({ listeners: this.state.listeners.concat(newListener) });
    }
  };

  removeListeners = (listeners) => {
    listeners.forEach((listener) => {
      listener.ref.child(listener.id).off(listener.event);
    });
  };

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
  };

  addListener = (channelId) => {
    this.addMessageListener(channelId);
    this.addTypingListener(channelId);
  };

  addTypingListener = (channelId) => {
    let typingUsers = [];
    this.state.typingRef.child(channelId).on('child_added', (snap) => {
      if (snap.key !== this.state.user.uid) {
        typingUsers = typingUsers.concat({
          id: snap.key,
          name: snap.val(),
        });
        this.setState({ typingUsers });
      }
    });
    this.addToListeners(channelId, this.state.typingRef, 'child_added');

    this.state.typingRef.child(channelId).on('child_removed', (snap) => {
      const index = typingUsers.findIndex((user) => user.id === snap.key);
      if (index !== -1) {
        typingUsers = typingUsers.filter((user) => user.id !== snap.key);
        this.setState({ typingUsers });
      }
    });
    this.addToListeners(channelId, this.state.typingRef, 'child_removed');

    this.state.connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        this.state.typingRef
          .child(channelId)
          .child(this.state.user.uid)
          .onDisconnect()
          .remove((err) => {
            if (err !== null) {
              console.error(err);
            }
          });
      }
    });
  };

  addUserStarsListener = (channelId, uid) => {
    this.state.usersRef
      .child(uid)
      .child('starred')
      .once('value')
      .then((data) => {
        if (data.val() !== null) {
          const channelIds = Object.keys(data.val());
          const prevStarred = channelIds.includes(channelId);
          this.setState({ isChannelStarred: prevStarred });
        }
      });
  };

  addMessageListener = (channelId) => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();
    ref.child(channelId).on('child_added', (snap) => {
      loadedMessages.push(snap.val());
      this.countUniqueUsers(loadedMessages);
      this.setState({
        messages: loadedMessages,
        messagesLoading: false,
      });
      this.countUserPosts(loadedMessages);
    });
    this.addToListeners(channelId, ref, 'child_added');
  };

  countUniqueUsers = (messages) => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);
    const wordUser = uniqueUsers.length > 1 ? 'Users' : 'User';
    const numUniqueUsers = `${uniqueUsers.length} ${wordUser}`;
    this.setState({ numUniqueUsers });
  };

  countUserPosts = (messages) => {
    let userPosts = messages.reduce((acc, message) => {
      if (message.user.name in acc) {
        acc[message.user.name].count += 1;
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1,
        };
      }
      return acc;
    }, {});
    this.props.setUserPosts(userPosts);
  };

  handleSearchChange = (event) => {
    this.setState(
      {
        searchTerm: event.target.value,
        searchLoading: true,
      },
      () => {
        this.handleSearchMessages();
      }
    );
  };
  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, 'gi');
    const searchResults = channelMessages.filter((message) => {
      return message.content && message.content.match(regex);
    });
    this.setState({ searchResults });
    setTimeout(() => this.setState({ searchLoading: false }), 1000);
  };

  displayMessages = (messages) => {
    return (
      messages.length > 0 &&
      messages.map((message) => (
        <Message
          key={message.timestamp}
          message={message}
          user={this.state.user}
        />
      ))
    );
  };

  displayChannelName = (channel) => {
    return channel
      ? `${this.state.isPrivateChannel ? '@' : '#'}${channel.name}`
      : '';
  };

  displayTypingUsers = (users) =>
    users.length > 0 &&
    users.map((user) => (
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '0.2em' }}
        key={user.id}
      >
        <span className="user__typing">{user.name} is typing</span>
        <Typing />
      </div>
    ));

  displayMessagesSkeleton = (loading) =>
    loading ? (
      <React.Fragment>
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} />
        ))}
      </React.Fragment>
    ) : null;

  render() {
    const {
      messages,
      channel,
      user,
      numUniqueUsers,
      searchTerm,
      searchResults,
      searchLoading,
      isPrivateChannel,
      isChannelStarred,
      typingUsers,
      messagesLoading,
    } = this.state;
    return (
      <React.Fragment>
        <MessagesHeader
          isPrivateChannel={isPrivateChannel}
          searchLoading={searchLoading}
          handleSearchChange={this.handleSearchChange}
          numUniqueUsers={numUniqueUsers}
          channelName={this.displayChannelName(channel)}
          handleStar={this.handleStar}
          isChannelStarred={isChannelStarred}
        />
        <Segment>
          <Comment.Group className="messages">
            {this.displayMessagesSkeleton(messagesLoading)}
            {searchTerm
              ? this.displayMessages(searchResults)
              : this.displayMessages(messages)}
            {this.displayTypingUsers(typingUsers)}
            <div ref={(node) => (this.messagesEnd = node)}></div>
          </Comment.Group>
        </Segment>
        <MessageForm
          isPrivateChannel={isPrivateChannel}
          currentChannel={channel}
          currentUser={user}
          getMessagesRef={this.getMessagesRef}
        ></MessageForm>
      </React.Fragment>
    );
  }
}

export default connect(null, { setUserPosts })(Messages);
