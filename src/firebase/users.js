import {
  doc, getDoc, setDoc, getDocs,
  collection, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export const getUserRole = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().role : null;
};

/**
 * Write (or merge) a user profile into Firestore.
 * `name` is optional — used for display in the Doctor combobox.
 */
export const createUserProfile = async (uid, email, role, name) => {
  await setDoc(
    doc(db, 'users', uid),
    { email, role, ...(name ? { name } : {}), createdAt: serverTimestamp() },
    { merge: true }
  );
};

/**
 * Fetch all users whose role is 'doctor'.
 * Returns an array of { id, email, name?, role, createdAt }.
 */
export const getDoctors = async () => {
  const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
