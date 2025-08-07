// Firebase Configuration for AI Tools Dashboard
// Client-side Firebase initialization for web application

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7mWFXP0RCnSbIlr9JpIcJ6YPd0g9Kj6M",
  authDomain: "ai-tracker-466821.firebaseapp.com",
  projectId: "ai-tracker-466821",
  storageBucket: "ai-tracker-466821.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijk"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Export for use in other scripts
window.firebaseConfig = firebaseConfig;
window.db = db;

console.log('✅ Firebase initialized successfully');