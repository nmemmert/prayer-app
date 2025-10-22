// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHtvhdtBxNwf0UE3Fp5P0v1vITZKhLMJw",
  authDomain: "prayer-app-6701f.firebaseapp.com",
  projectId: "prayer-app-6701f",
  storageBucket: "prayer-app-6701f.firebasestorage.app",
  messagingSenderId: "555011794707",
  appId: "1:555011794707:web:a3d60bdee742578cca1ce6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);