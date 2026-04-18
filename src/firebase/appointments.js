import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

const COL = 'appointments';

/** Fetch every appointment — used by receptionist & admin. */
export const getAppointments = async () => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Fetch only the appointments belonging to a specific doctor.
 * Uses a single-field `where` clause (no composite index needed).
 * Sorted client-side to avoid a Firestore index requirement.
 */
export const getDoctorAppointments = async (doctorId) => {
  const q = query(collection(db, COL), where('doctorId', '==', doctorId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
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
