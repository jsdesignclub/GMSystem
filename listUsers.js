import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLpoi1AL6AUDPTMqGwTnCIMthNWd4b1HA",
  authDomain: "my-webapp-bb4f8.firebaseapp.com",
  projectId: "my-webapp-bb4f8",
  storageBucket: "my-webapp-bb4f8.firebasestorage.app",
  messagingSenderId: "754057322842",
  appId: "1:754057322842:web:7c374a78ee1fbd02d91363"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  const users = querySnapshot.docs.map(doc => ({
    email: doc.data().email,
    role: doc.data().role,
    status: doc.data().status
  }));
  console.log(JSON.stringify(users, null, 2));
}

listUsers().catch(console.error);
