// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

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

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Firebase Analytics and get a reference to the service
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let analytics: any = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  });
}

export { analytics };

export { app };