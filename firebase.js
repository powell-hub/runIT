const firebaseConfig = {
  apiKey: "AIzaSyAMaJI7m-3XG31kMTkVwq5iANQmftynGKk",
  authDomain: "runit-d3c79.firebaseapp.com",
  projectId: "runit-d3c79",
  storageBucket: "runit-d3c79.firebasestorage.app",
  messagingSenderId: "1006580845621",
  appId: "1:1006580845621:web:dc6b2658e63e935c87757c"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
