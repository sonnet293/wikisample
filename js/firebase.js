// js/firebase.js
// 빌드 도구 없이 브라우저에서 바로 쓰기 위해 Firebase SDK를 CDN(ES 모듈)으로 불러온다.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyALputdUTZOuBGUt90dKjpN9cI9R4RuvAo',
  authDomain: 'wiki-c09b9.firebaseapp.com',
  projectId: 'wiki-c09b9',
  storageBucket: 'wiki-c09b9.firebasestorage.app',
  messagingSenderId: '673610839262',
  appId: '1:673610839262:web:e605bab16eda5f82723e4f',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
