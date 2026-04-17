import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

const COL = 'appointments';

export const getAppointments = async () => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addAppointment = async (data) => {
  return addDoc(collection(db, COL), {
    ...data,
    status: 'scheduled',
    createdAt: serverTimestamp()
  });
};

export const updateAppointment = async (id, data) => {
  return updateDoc(doc(db, COL, id), data);
};

export const deleteAppointment = async (id) => {
  return deleteDoc(doc(db, COL, id));
};
