import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, orderBy, serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';

const COL = 'inventory';

export const getInventory = async () => {
  const q = query(collection(db, COL), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addInventoryItem = async (data) => {
  return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
};

export const updateInventoryItem = async (id, data) => {
  return updateDoc(doc(db, COL, id), data);
};

export const deleteInventoryItem = async (id) => {
  return deleteDoc(doc(db, COL, id));
};

// ─────────────────────────────────────────────────────────────────────────────
// ATOMIC TRANSACTION — safely decrement quantities for multiple items at once.
// Throws if any item doesn't have enough stock.
// usedItems = [{ id, quantity }, ...]
// ─────────────────────────────────────────────────────────────────────────────
export const consumeInventoryItems = async (usedItems) => {
  await runTransaction(db, async (transaction) => {
    const refs = usedItems.map(item => doc(db, COL, item.id));
    const snaps = await Promise.all(refs.map(r => transaction.get(r)));

    snaps.forEach((snap, i) => {
      if (!snap.exists()) throw new Error(`Item ${usedItems[i].id} not found`);
      const current = snap.data().quantity;
      const needed = usedItems[i].quantity;
      if (current < needed) {
        throw new Error(`Insufficient stock for "${snap.data().name}": ${current} available, ${needed} needed`);
      }
      transaction.update(refs[i], { quantity: current - needed });
    });
  });
};
