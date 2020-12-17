import React from "react";
import { Segment, Comment } from "semantic-ui-react";
import firebase from "../../firebase";

import MessagesHeader from "./MessagesHeader";
import MessageForm from "./MessageForm";
import Message from "./Message";

class Messages extends React.Component {
  state = {
    messagesRef: firebase.database().ref("messages"),
    privateMessagesRef: firebase.database().ref("privateMessage"),
    messages: [],
    messagesLoading: true,
    privateChannel: this.props.isPrivateChannel,
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    numUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    searchResults: [],
  };

  componentDidMount() {
    const { channel, user } = this.state;

    if (channel && user) {
      this.addListeners(channel.id);
    }
  }

  addListeners = channelId => {
    this.addMessageListener(channelId);
  };

  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessageRef();
    ref.child(channelId).on("child_added", snap => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      });
      this.countUniqueUsers(loadedMessages);
    });
  };

  getMessageRef = () => {
    const { messagesRef,privateMessagesRef,privateChannel} = this.state; 
    return privateChannel ? privateMessagesRef : messagesRef;
  }

  handleSearchChange = event =>{
    this.setState({
      searchTerm: event.target.value,
      searchLoading: true,
    },()=> this.handleSearchMessage());
  }

  handleSearchMessage = ()=>{
    const channelMessage = this.state.messages;
    const regex = new RegExp(this.state.searchTerm,'gi');
    const searchResults = channelMessage.reduce((acc,message)=>{
      if(message.content && message.content.match(regex) || message.user.name.match(regex)){
        acc.push(message);
      }
      return acc;
    },[])
    this.setState({ searchResults})
    setTimeout(()=>this.setState({searchLoading: false}),400);
  };

  countUniqueUsers = messages =>{
    const uniqueUsers = messages.reduce((acc, message) => {
      if(!acc.includes(message.user.name)){
        acc.push(message.user.name);
      }
      return acc;
    },[]);
    const plural = uniqueUsers.length > 1;
    const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s":""}`;
    this.setState({numUniqueUsers});
  }

  displayMessages = messages =>
    messages.length > 0 &&
    messages.map(message => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.state.user}
      />
    ));

    displayChannelName = channel => channel ? `${this.state.privateChannel ? "@" : "#"}${channel.name}`:'';

  render() {
    const { messagesRef, messages, channel, user,searchTerm, searchLoading, searchResults, numUniqueUsers,privateChannel } = this.state;

    return (
      <React.Fragment>
        <MessagesHeader 
          channelName = {this.displayChannelName(channel)}
          uniqueUsers = {numUniqueUsers}
          handleSearchChange = {this.handleSearchChange}
          searchLoading={searchLoading}
          privateChannel={privateChannel}
        />

        <Segment>
          <Comment.Group className="messages">
            {searchTerm ? this.displayMessages(searchResults): this.displayMessages(messages)}
          </Comment.Group>
        </Segment>

        <MessageForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
          privateChannel={privateChannel}
          getMessageRef={this.getMessageRef}
        />
      </React.Fragment>
    );
  }
}

export default Messages;