// Address management — stored as users/{uid}.addresses[] per spec.
// Firestore has no atomic "update one item in an array of objects" op, so we
// read-modify-write the whole array. Fine at address-book scale (a handful
// of entries per customer).
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Address } from '../../types/firestore';

function genId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `addr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface AddressInput {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  country: string;
  pincode: string;
  isDefault?: boolean;
}

export function validateAddress(input: AddressInput): string[] {
  const errors: string[] = [];
  if (!input.fullName?.trim()) errors.push('Full name is required.');
  if (!input.phone?.trim() || !/^\d{10}$/.test(input.phone.trim())) {
    errors.push('Enter a valid 10-digit phone number.');
  }
  if (!input.line1?.trim()) errors.push('Address line 1 is required.');
  if (!input.city?.trim()) errors.push('City is required.');
  if (!input.state?.trim()) errors.push('State is required.');
  if (!input.country?.trim()) errors.push('Country is required.');
  if (!input.pincode?.trim() || !/^\d{4,10}$/.test(input.pincode.trim())) {
    errors.push('Enter a valid pincode.');
  }
  return errors;
}

async function getAddresses(uid: string): Promise<Address[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return [];
  return (snap.data().addresses as Address[]) || [];
}

async function saveAddresses(uid: string, addresses: Address[]) {
  await updateDoc(doc(db, 'users', uid), { addresses });
}

export async function addAddress(uid: string, input: AddressInput): Promise<Address> {
  try {
    const addresses = await getAddresses(uid);
    const newAddress: Address = { id: genId(), ...input, isDefault: !!input.isDefault };
    let next = [...addresses, newAddress];
    if (newAddress.isDefault || next.length === 1) {
      next = next.map((a) => ({ ...a, isDefault: a.id === newAddress.id }));
    }
    await saveAddresses(uid, next);
    return next.find((a) => a.id === newAddress.id)!;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

export async function updateAddress(uid: string, addressId: string, input: AddressInput) {
  try {
    const addresses = await getAddresses(uid);
    let next = addresses.map((a) => (a.id === addressId ? { ...a, ...input, id: addressId } : a));
    if (input.isDefault) {
      next = next.map((a) => ({ ...a, isDefault: a.id === addressId }));
    }
    await saveAddresses(uid, next);
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

export async function deleteAddress(uid: string, addressId: string) {
  try {
    const addresses = await getAddresses(uid);
    const wasDefault = addresses.find((a) => a.id === addressId)?.isDefault;
    let next = addresses.filter((a) => a.id !== addressId);
    if (wasDefault && next.length > 0) {
      next = next.map((a, i) => ({ ...a, isDefault: i === 0 }));
    }
    await saveAddresses(uid, next);
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

export async function setDefaultAddress(uid: string, addressId: string) {
  try {
    const addresses = await getAddresses(uid);
    const next = addresses.map((a) => ({ ...a, isDefault: a.id === addressId }));
    await saveAddresses(uid, next);
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}
