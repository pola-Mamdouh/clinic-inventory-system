import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

const COL = 'examinations';

export const getExaminations = async () => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addExamination = async (data) => {
  return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
};
