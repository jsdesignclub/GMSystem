import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Replace the following with your app's Firebase project configuration
// You can find this in your Firebase Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyDLpoi1AL6AUDPTMqGwTnCIMthNWd4b1HA",
  authDomain: "my-webapp-bb4f8.firebaseapp.com",
  databaseURL: "https://my-webapp-bb4f8-default-rtdb.firebaseio.com",
  projectId: "my-webapp-bb4f8",
  storageBucket: "my-webapp-bb4f8.firebasestorage.app",
  messagingSenderId: "754057322842",
  appId: "1:754057322842:web:7c374a78ee1fbd02d91363",
  measurementId: "G-NSVB91FWH4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
