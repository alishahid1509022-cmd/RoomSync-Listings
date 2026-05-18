// Firebase configuration for RoomSync Listings
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Paste YOUR config object from Firebase console here
const firebaseConfig = {
  apiKey: "AIzaSyCqJ--xK9ct-vIhMFL8zGBtInErdFbNh-M",
  authDomain: "roomsync-listings.firebaseapp.com",
  projectId: "roomsync-listings",
  storageBucket: "roomsync-listings.firebasestorage.app",
  messagingSenderId: "1017540776785",
  appId: "1:1017540776785:web:4749c10bbb3ca3be933970",
  measurementId: "G-5MWQ97KP30"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore and export it for use in components
export const db = getFirestore(app)

// Initialize Auth and export it for use in components
export const auth = getAuth(app)

// Google sign-in provider — reused across the app
export const googleProvider = new GoogleAuthProvider()