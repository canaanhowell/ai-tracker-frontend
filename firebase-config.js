console.log('=== FIREBASE-CONFIG.JS LOADED ===');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCJNad4bjOyrEq0xGjhR1bpVZLt8sPWwHE",
    authDomain: "ai-tracker-466821.firebaseapp.com",
    projectId: "ai-tracker-466821",
    storageBucket: "ai-tracker-466821.appspot.com",
    messagingSenderId: "726614268788",
    appId: "1:726614268788:web:c0f5c8d9e2a3b4d5e6f7"
};

// Initialize Firebase
console.log('Initializing Firebase...');
firebase.initializeApp(firebaseConfig);
console.log('Firebase initialized');

// Initialize Firestore
const db = firebase.firestore();
console.log('Firestore initialized');

// Export for use in other modules
window.db = db;
console.log('window.db set');