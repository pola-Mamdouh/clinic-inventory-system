import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { createUserProfile } from './users';

const isEmpty = async (col) => {
  const snap = await getDocs(collection(db, col));
  return snap.empty;
};

const PATIENTS = [
  { firstName: 'Sara',    lastName: 'Johnson',  email: 'sara@email.com',   phone: '555-0101', gender: 'Female', bloodType: 'A+',  dateOfBirth: '1990-05-15', notes: 'No known allergies' },
  { firstName: 'Ahmed',   lastName: 'Hassan',   email: 'ahmed@email.com',  phone: '555-0102', gender: 'Male',   bloodType: 'O+',  dateOfBirth: '1985-03-22', notes: 'Diabetic — monitor glucose' },
  { firstName: 'Lina',    lastName: 'Morales',  email: 'lina@email.com',   phone: '555-0103', gender: 'Female', bloodType: 'B-',  dateOfBirth: '2000-11-08', notes: 'Penicillin allergy' },
  { firstName: 'James',   lastName: 'Carter',   email: 'james@email.com',  phone: '555-0104', gender: 'Male',   bloodType: 'AB+', dateOfBirth: '1978-07-30', notes: 'Hypertension' },
  { firstName: 'Nour',    lastName: 'Al-Rashid',email: 'nour@email.com',   phone: '555-0105', gender: 'Female', bloodType: 'O-',  dateOfBirth: '1995-01-14', notes: 'Asthma' },
];

const today = new Date().toISOString().split('T')[0];
const APPOINTMENTS = [
  { patientName: 'Sara Johnson',   doctorName: 'Dr. Ahmed',   date: today,        time: '09:00', reason: 'Annual checkup',       status: 'scheduled',   priority: 'normal' },
  { patientName: 'Ahmed Hassan',   doctorName: 'Dr. Ahmed',   date: today,        time: '10:30', reason: 'Diabetes follow-up',    status: 'scheduled',   priority: 'urgent' },
  { patientName: 'Lina Morales',   doctorName: 'Dr. Sarah',   date: today,        time: '11:00', reason: 'Allergy consultation',  status: 'in-progress', priority: 'normal' },
  { patientName: 'James Carter',   doctorName: 'Dr. Sarah',   date: '2026-04-20', time: '14:00', reason: 'Blood pressure review', status: 'scheduled',   priority: 'normal' },
  { patientName: 'Nour Al-Rashid', doctorName: 'Dr. Ahmed',   date: '2026-04-21', time: '09:30', reason: 'Asthma management',     status: 'scheduled',   priority: 'urgent' },
];

const INVENTORY = [
  { name: 'Paracetamol 500mg',    category: 'Medicine',   unit: 'boxes',   quantity: 48,  lowStockThreshold: 10, price: 2.50,  supplier: 'MedSupply Co.',    notes: 'Store below 25°C' },
  { name: 'Amoxicillin 250mg',    category: 'Medicine',   unit: 'boxes',   quantity: 3,   lowStockThreshold: 10, price: 5.00,  supplier: 'PharmaDist Ltd.',  notes: 'Refrigerate after opening' },
  { name: 'Ibuprofen 400mg',      category: 'Medicine',   unit: 'boxes',   quantity: 30,  lowStockThreshold: 8,  price: 3.25,  supplier: 'MedSupply Co.',    notes: '' },
  { name: 'Surgical Gloves L',    category: 'Surgical',   unit: 'boxes',   quantity: 4,   lowStockThreshold: 5,  price: 8.00,  supplier: 'SafeHands Corp.',  notes: 'Latex-free' },
  { name: 'Sterile Gauze Pads',   category: 'Surgical',   unit: 'packs',   quantity: 60,  lowStockThreshold: 15, price: 1.50,  supplier: 'SafeHands Corp.',  notes: '' },
  { name: 'Disposable Syringes',  category: 'Consumable', unit: 'boxes',   quantity: 120, lowStockThreshold: 20, price: 4.00,  supplier: 'MedEquip Inc.',    notes: '5ml, sterile' },
  { name: 'Digital Thermometer',  category: 'Diagnostic', unit: 'pcs',     quantity: 8,   lowStockThreshold: 3,  price: 12.00, supplier: 'DiagTech Co.',     notes: '' },
  { name: 'Blood Pressure Cuff',  category: 'Diagnostic', unit: 'pcs',     quantity: 5,   lowStockThreshold: 2,  price: 35.00, supplier: 'DiagTech Co.',     notes: '' },
  { name: 'IV Cannula 18G',       category: 'Surgical',   unit: 'boxes',   quantity: 2,   lowStockThreshold: 5,  price: 6.50,  supplier: 'SafeHands Corp.',  notes: 'Single use' },
  { name: 'Alcohol Swabs',        category: 'Consumable', unit: 'boxes',   quantity: 200, lowStockThreshold: 30, price: 1.20,  supplier: 'MedSupply Co.',    notes: '70% isopropyl' },
];

// uid → role mapping for the three demo accounts
// Must match the UIDs of users you created in Firebase Auth
const USER_ROLES = [
  { email: 'receptionist@clinic.com', role: 'receptionist' },
  { email: 'doctor@clinic.com',       role: 'doctor' },
  { email: 'inventory@clinic.com',    role: 'inventory' },
];

export const seedDatabase = async (onProgress) => {
  const results = { patients: 0, appointments: 0, inventory: 0, skipped: [] };

  // Patients
  onProgress('Seeding patients...');
  if (await isEmpty('patients')) {
    for (const p of PATIENTS) {
      await addDoc(collection(db, 'patients'), { ...p, createdAt: serverTimestamp() });
      results.patients++;
    }
  } else { results.skipped.push('patients'); }

  // Appointments
  onProgress('Seeding appointments...');
  if (await isEmpty('appointments')) {
    for (const a of APPOINTMENTS) {
      await addDoc(collection(db, 'appointments'), { ...a, createdAt: serverTimestamp() });
      results.appointments++;
    }
  } else { results.skipped.push('appointments'); }

  // Inventory
  onProgress('Seeding inventory...');
  if (await isEmpty('inventory')) {
    for (const i of INVENTORY) {
      await addDoc(collection(db, 'inventory'), { ...i, createdAt: serverTimestamp() });
      results.inventory++;
    }
  } else { results.skipped.push('inventory'); }

  return results;
};

// Called after login — reads the UID from Firebase Auth and writes the role to Firestore
export const seedUserRoles = async (currentUser) => {
  const match = USER_ROLES.find(u => u.email === currentUser.email);
  if (match) {
    await createUserProfile(currentUser.uid, currentUser.email, match.role);
  }
};
