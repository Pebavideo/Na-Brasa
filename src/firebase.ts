import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Credenciais oficiais do projeto Na-Brasa (Firebase Spark Plan)
export const firebaseConfig = {
  apiKey: 'AIzaSyCapVIT-6mIALIIsn7j9Pq2y2fgx4uNEqY',
  authDomain: 'na-brasa-ff2e0.firebaseapp.com',
  projectId: 'na-brasa-ff2e0',
  storageBucket: 'na-brasa-ff2e0.firebasestorage.app',
  messagingSenderId: '444729562321',
  appId: '1:444729562321:web:fed972196f17b2cde961f0',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
