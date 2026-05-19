import { useParams, useNavigate } from 'react-router-dom';
import { useAssignedPatients }    from '@/hooks/useDoctorData';
import PatientVitalsView          from '@/components/PatientVitalsView';

export default function PatientVitals() {
  const { patientId } = useParams<{ patientId: string }>();
  const { patients }  = useAssignedPatients();
  const navigate      = useNavigate();
  const patient       = patients.find((p) => p.id === patientId);

  if (!patientId) return null;

  return (
    <PatientVitalsView
      patientId={patientId}
      patientName={patient?.full_name ?? 'Patient'}
      onBack={() => navigate('/dashboard')}
      backLabel="← All Patients"
    />
  );
}