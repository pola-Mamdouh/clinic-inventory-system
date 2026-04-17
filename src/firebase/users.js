import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const getUserRole = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().role : null;
};

export const createUserProfile = async (uid, email, role) => {
  await setDoc(doc(db, 'users', uid), {
    email,
    role,
    createdAt: serverTimestamp(),
  }, { merge: true });
};
