import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

const COL = 'patients';

export const getPatients = async () => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addPatient = async (data) => {
  return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
};

export const updatePatient = async (id, data) => {
  return updateDoc(doc(db, COL, id), data);
};

export const deletePatient = async (id) => {
  return deleteDoc(doc(db, COL, id));
};
