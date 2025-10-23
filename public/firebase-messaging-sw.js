// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

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
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png' // Update with your app icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});