import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from './useProfile';

export interface PatientFormData {
  full_name:         string;
  date_of_birth:     string;
  gender:            'Male' | 'Female' | 'Other';
  blood_type:        string;
  diagnosis:         string;
  bed_number:        string;
  emergency_contact: string;
}

function friendlyError(message: string): string {
  // Only catch the specific unique constraint violation, not any mention of bed_number
  if (message.includes('patients_bed_number_unique')) {
    return 'That bed is already occupied. Please assign a different bed number.';
  }
  return message;
}

const HOME = 'home';

async function isBedTaken(bedNumber: string, excludePatientId?: string): Promise<boolean> {
  const trimmed = bedNumber.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase() === HOME) return false; // Home is not exclusive

  let query = supabase
    .from('patients')
    .select('id')
    .eq('bed_number', trimmed)
    .limit(1);

  if (excludePatientId) {
    query = query.neq('id', excludePatientId);
  }

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

export function usePatientManagement(onSuccess?: () => void) {
  const { profile } = useProfile();

  // REPLACE the entire addPatient callback with:
const addPatient = useCallback(async (form: PatientFormData): Promise<string> => {
  if (!profile) throw new Error('Not authenticated');

  const trimmedBed = form.bed_number.trim();
  const isHome     = trimmedBed.toLowerCase() === HOME;

  // Home is non-exclusive — skip uniqueness check.
  if (trimmedBed && !isHome) {
    const taken = await isBedTaken(trimmedBed);
    if (taken) throw new Error('That bed is already occupied. Please assign a different bed number.');
  }

  const { data: patient, error: insertErr } = await supabase
    .from('patients')
    .insert({
      full_name:         form.full_name.trim(),
      date_of_birth:     form.date_of_birth || null,
      gender:            form.gender,
      blood_type:        form.blood_type,
      diagnosis:         form.diagnosis.trim(),
      // Store Home patients as NULL so any DB UNIQUE constraint is never hit.
      bed_number:        isHome ? null : (trimmedBed || null),
      emergency_contact: form.emergency_contact.trim(),
    })
    .select('id')
    .single();

  if (insertErr) throw new Error(friendlyError(insertErr.message));

  const { error: linkErr } = await supabase
    .from('doctor_patients')
    .insert({ doctor_id: profile.id, patient_id: patient.id });

  if (linkErr) throw new Error(linkErr.message);

  onSuccess?.();
  return patient.id;            
}, [profile, onSuccess]);

  const editPatient = useCallback(async (patientId: string, form: PatientFormData) => {
    // Inside editPatient, replace the two lines that build bed_number:
const trimmedBed = form.bed_number.trim();
const isHome     = trimmedBed.toLowerCase() === HOME;

if (trimmedBed && !isHome) {
  const taken = await isBedTaken(trimmedBed, patientId);
  if (taken) throw new Error('That bed is already occupied. Please assign a different bed number.');
}

// In the .update() call:
bed_number: isHome ? null : (trimmedBed || null)

    const { error } = await supabase
      .from('patients')
      .update({
        full_name:         form.full_name.trim(),
        date_of_birth:     form.date_of_birth || null,
        gender:            form.gender,
        blood_type:        form.blood_type,
        diagnosis:         form.diagnosis.trim(),
        bed_number:        form.bed_number.trim() || null,
        emergency_contact: form.emergency_contact.trim(),
      })
      .eq('id', patientId);

    if (error) throw new Error(friendlyError(error.message));
    onSuccess?.();
  }, [onSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  const dischargePatient = useCallback(async (patientId: string) => {
    if (!profile) throw new Error('Not authenticated');

    await supabase
      .from('devices')
      .update({ patient_id: null, status: 'unassigned' })
      .eq('patient_id', patientId);

    await supabase
      .from('patients')
      .update({ bed_number: null })
      .eq('id', patientId);

    const { error } = await supabase
      .from('doctor_patients')
      .delete()
      .eq('doctor_id', profile.id)
      .eq('patient_id', patientId);

    if (error) throw new Error(error.message);
    onSuccess?.();
  }, [profile, onSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  return { addPatient, editPatient, dischargePatient };
}