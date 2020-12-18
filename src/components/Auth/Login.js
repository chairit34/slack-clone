import React, { Component } from 'react';
import { Grid, Form, Message, Segment, Button, Header, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import firebase from '../../firebase';

export default class Login extends Component {
  state = {
    email: '',
    password: '',
    errors: [],
    loading: false,
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    if (this.isFormValid(this.state)) {
      this.setState({ loading: true });
      firebase
        .auth()
        .signInWithEmailAndPassword(this.state.email, this.state.password)
        .then((signedInUser) => {
          console.log(signedInUser);
        })
        .catch((err) => {
          console.error(err);
          this.setState({
            errors: this.state.errors.concat(err),
            loading: false,
          });
        });
    }
  };

  isFormValid = ({ email, password }) => email && password;

  displayErrors = (errors) => errors.map((error, i) => <p key={i}>{error.message}</p>);

  handleInputError = (errors, inputName) => {
    return errors.some((error) => error.message.toLowerCase().includes(inputName)) ? 'error' : '';
  };

  render() {
    const { email, password, errors, loading } = this.state;
    return (
      <Grid className="app" textAlign="center" verticalAlign="middle">
        <Grid.Column style={{ maxWidth: 458 }}>
          <Header as="h1" icon color="orange" textAlign="center">
            <Icon name="rocketchat" color="orange" />
            Login to DevChat
          </Header>
          <Form onSubmit={this.handleSubmit} size="large">
            <Segment stacked>
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
              <Button disabled={loading} className={loading ? 'loading' : ''} color="orange" fluid size="large">
                Login
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
            Dont' have an account?<Link to="/register">Register</Link>
          </Message>
        </Grid.Column>
      </Grid>
    );
  }
}
