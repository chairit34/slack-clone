import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';

var firebaseConfig = {
  apiKey: 'AIzaSyDHuKA3K7s4YTWOCpIQ4kcjAdl0W9knZss',
  authDomain: 'react-slack-clone-d24c3.firebaseapp.com',
  databaseURL: 'https://react-slack-clone-d24c3.firebaseio.com',
  projectId: 'react-slack-clone-d24c3',
  storageBucket: 'react-slack-clone-d24c3.appspot.com',
  messagingSenderId: '525576179422',
  appId: '1:525576179422:web:c2f260bfd40900b7b7bc4f',
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase;
