// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDASP8oi_AVInVq3s-aC6reLGigpWMqug",
  authDomain: "ajanhallinta-d44d7.firebaseapp.com",
  projectId: "ajanhallinta-d44d7",
  storageBucket: "ajanhallinta-d44d7.firebasestorage.app",
  messagingSenderId: "674847778049",
  appId: "1:674847778049:web:72180966938e47eb102700"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore: Firestore = getFirestore(app);

export { firestore };
