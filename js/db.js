// js/db.js
// Firestore: documents/{인코딩된 제목} = { title, content, updatedAt, updatedBy{uid,name} }
import { db } from './firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// 문서 ID에는 '/'를 쓸 수 없고 '.', '..' 도 금지라 인코딩해서 쓴다.
const docRef = (title) => doc(db, 'documents', encodeURIComponent(title).replace(/\./g, '%2E'));

export async function getDocument(title) {
  const snap = await getDoc(docRef(title));
  return snap.exists() ? snap.data() : null;
}

export async function saveDocument(title, content, user) {
  await setDoc(docRef(title), {
    title,
    content,
    updatedAt: serverTimestamp(),
    updatedBy: { uid: user.uid, name: user.displayName || user.email.split('@')[0] },
  });
}
