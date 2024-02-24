const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyB4pveGpjcR3S-oFXxB_uAbgfCvgeJD7nw",
  authDomain: "xh-murojaat.firebaseapp.com",
  projectId: "xh-murojaat",
  storageBucket: "xh-murojaat.appspot.com",
  messagingSenderId: "648920797834",
  appId: "1:648920797834:web:be60f949508be5c80dd373",
  measurementId: "G-Q84TZ7DZPN"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

module.exports={db}