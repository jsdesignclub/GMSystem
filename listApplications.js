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

async function listApplications() {
  const querySnapshot = await getDocs(collection(db, "applications"));
  const emails = new Set();
  querySnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.officer?.email) emails.add(data.officer.email);
    if (data.dsReview?.reviewedBy) emails.add(data.dsReview.reviewedBy);
    if (data.directorReview?.reviewedBy) emails.add(data.directorReview.reviewedBy);
  });
  console.log("Emails found:", Array.from(emails));
}

listApplications().catch(console.error);
