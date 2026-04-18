/**
 * admin.js — Admin-only Firebase operations
 *
 * KEY PATTERN — Secondary App for account creation:
 * ─────────────────────────────────────────────────
 * Firebase's client SDK signs the *current user out* when
 * createUserWithEmailAndPassword() succeeds.  To keep the
 * admin session alive we spin up a second, isolated Firebase
 * App instance ("secondary").  The secondary auth context
 * creates the new account and is immediately signed out
 * afterwards.  The primary auth context (admin's session)
 * is never touched.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { createUserProfile } from './users';
import { db } from './config';

const SECONDARY_APP_NAME = 'medicore-admin-secondary';

const getSecondaryAuth = () => {
  const existing = getApps().find(a => a.name === SECONDARY_APP_NAME);
  const app = existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  return getAuth(app);
};

/**
 * Register a new doctor account.
 *
 * 1. Creates a Firebase Auth user via the secondary app instance
 *    (admin session is untouched).
 * 2. Writes the doctor profile to Firestore users/{uid}.
 * 3. Signs out the secondary app.
 *
 * @param {{ name: string, email: string, password: string, specialty: string }} data
 * @returns {Promise<{ id: string, name: string, email: string, specialty: string, role: 'doctor' }>}
 */
export const createDoctor = async ({ name, email, password, specialty }) => {
  const secondaryAuth = getSecondaryAuth();

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  } catch (err) {
    // Re-throw with a human-readable message
    if (err.code === 'auth/email-already-in-use')
      throw new Error('A user with this email already exists.');
    if (err.code === 'auth/weak-password')
      throw new Error('Password must be at least 6 characters.');
    if (err.code === 'auth/invalid-email')
      throw new Error('Please enter a valid email address.');
    throw err;
  }

  try {
    await createUserProfile(cred.user.uid, email, 'doctor', name, specialty);
  } catch (profileErr) {
    // Profile write failed — clean up the orphaned Auth user if we can,
    // then surface the error so the admin can retry.
    console.error('Profile write failed after Auth user creation:', profileErr);
    throw new Error('Account created but profile save failed. Please contact support.');
  } finally {
    // Always clean up the secondary auth session
    await signOut(secondaryAuth).catch(() => {});
  }

  return { id: cred.user.uid, name, email, specialty, role: 'doctor' };
};

/**
 * Remove a doctor profile from Firestore.
 * Note: This does NOT delete the Firebase Auth account
 * (that requires the Admin SDK / Cloud Function).
 * The doctor will lose their role and cannot access the system.
 */
export const removeDoctorProfile = async (uid) => {
  await deleteDoc(doc(db, 'users', uid));
};
