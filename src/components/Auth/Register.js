import React, { Component } from 'react';
import {
  Grid,
  Form,
  Message,
  Segment,
  Button,
  Header,
  Icon,
} from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import firebase from '../../firebase';
import md5 from 'md5';

export default class Register extends Component {
  state = {
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    errors: [],
    loading: false,
    userRefs: firebase.database().ref('users'),
  };

  isFormValid() {
    let errors = [];
    let isValid = true;
    console.log('checking form validity');
    if (this.isFormEmpty(this.state)) {
      let error = { message: 'Please fill in all fields' };
      errors.push(error);
      isValid = false;
    }
    if (!this.isPasswordValid(this.state)) {
      let error = { message: 'Password is invalid' };
      errors.push(error);
      isValid = false;
    }

    this.setState({ errors });
    return isValid;
  }

  isPasswordValid = ({ password, passwordConfirmation }) => {
    if (password.length < 6 || passwordConfirmation < 6) {
      return false;
    } else if (password !== passwordConfirmation) {
      return false;
    } else {
      return true;
    }
  };

  isFormEmpty = ({ username, email, password, passwordConfirmation }) => {
    return (
      !username.length ||
      !email.length ||
      !password.length ||
      !passwordConfirmation.length
    );
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    if (this.isFormValid()) {
      this.setState({ loading: true });
      firebase
        .auth()
        .createUserWithEmailAndPassword(this.state.email, this.state.password)
        .then((createdUser) => {
          console.log(createdUser);
          this.setState({ loading: false });
          createdUser.user
            .updateProfile({
              displayName: this.state.username,
            })
            .then(() => {
              this.saveUser(createdUser).then(() => {
                console.log('user saved');
              });
            })
            .catch((err) => {
              console.log(err);
              this.setState({ errors: this.state.errors.concat(err) });
            });
        })
        .catch((err) => {
          console.log(err);
          this.setState({
            errors: this.state.errors.concat(err),
            loading: false,
          });
        });
    }
  };

  saveUser = (createdUser) => {
    return this.state.userRefs.child(createdUser.user.uid).set({
      name: createdUser.user.displayName,
      avatar: createdUser.user.photoURL,
    });
  };

  displayErrors = (errors) =>
    errors.map((error, i) => <p key={i}>{error.message}</p>);

  handleInputError = (errors, inputName) => {
    return errors.some((error) =>
      error.message.toLowerCase().includes(inputName)
    )
      ? 'error'
      : '';
  };

  render() {
    const {
      username,
      email,
      password,
      confirmPassword,
      errors,
      loading,
    } = this.state;
    return (
      <Grid className="app" textAlign="center" verticalAlign="middle">
        <Grid.Column style={{ maxWidth: 458 }}>
          <Header as="h1" icon color="orange" textAlign="center">
            <Icon name="rocketchat" color="orange" />
            Register for DevChat
          </Header>
          <Form onSubmit={this.handleSubmit} size="large">
            <Segment stacked>
              <Form.Input
                fluid
                name="username"
                icon="user"
                iconPosition="left"
                placeholder="Username"
                value={username}
                onChange={this.handleChange}
                className={this.handleInputError(errors, 'username')}
                type="text"
              />
              <Form.Input
                fluid
                name="email"
                icon="mail"
                iconPosition="left"
                placeholder="Email"
                value={email}
                onChange={this.handleChange}
                className={this.handleInputError(errors, 'email')}
                type="email"
              />
              <Form.Input
                fluid
                name="password"
                icon="lock"
                iconPosition="left"
                placeholder="Password"
                value={password}
                onChange={this.handleChange}
                className={this.handleInputError(errors, 'password')}
                type="password"
              />
              <Form.Input
                fluid
                name="passwordConfirmation"
                icon="repeat"
                iconPosition="left"
                value={confirmPassword}
                placeholder="Password Confirmation"
                onChange={this.handleChange}
                className={this.handleInputError(errors, 'password')}
                type="password"
              />
              <Button
                disabled={loading}
                className={loading ? 'loading' : ''}
                color="orange"
                fluid
                size="large"
              >
                Submit
              </Button>
            </Segment>
          </Form>
          {errors.length > 0 && (
            <Message error>
              <h3>Errors</h3>
              {this.displayErrors(errors)}
            </Message>
          )}
          <Message>
            Already a user?<Link to="/login">Login</Link>
          </Message>
        </Grid.Column>
      </Grid>
    );
  }
}
