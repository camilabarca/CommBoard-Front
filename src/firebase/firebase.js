import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB9lUPXWpyTN7PkBaBoV-qXGHr5viSi6KM",
    authDomain: "commboard-e5504.firebaseapp.com",
    projectId: "commboard-e5504",
    storageBucket: "commboard-e5504.appspot.com",
    messagingSenderId: "301999608187",
    appId: "1:301999608187:web:b4ab340244dc7685232dde",
    measurementId: "G-FS67EPLY8G"
  };

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = firebase.firestore();
export const database = firebase.database();
export const storage = firebase.storage();
