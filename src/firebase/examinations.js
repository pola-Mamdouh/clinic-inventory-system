import {
  collection, addDoc, getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

const COL = 'examinations';

/** Fetch all examinations ordered newest-first. */
export const getExaminations = async () => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Fetch all examinations for a specific patient.
 * Uses a single-field WHERE clause (no composite index needed),
 * sorted client-side newest-first.
 */
export const getPatientExaminations = async (patientId) => {
  const q = query(collection(db, COL), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
};

/**
 * Save a new examination record.
 * Always include patientId so history queries work.
 */
export const addExamination = async (data) => {
  return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
};
