import { useParams, useNavigate } from 'react-router-dom';
import { useFamilyData }          from '@/hooks/useFamilyData';
import PatientVitalsView          from '@/components/PatientVitalsView';

export default function FamilyPatient() {
  const { patientId }        = useParams<{ patientId: string }>();
  const { approvedPatients } = useFamilyData();
  const navigate             = useNavigate();
  const patient              = approvedPatients.find((p) => p.patient_id === patientId);

  if (!patientId || (approvedPatients.length > 0 && !patient)) {
    return (
      <div className="bg-status-critical/5 border border-status-critical/20 rounded-xl p-6">
        <p className="text-sm font-mono text-status-critical">
          Access denied. You don't have approved access to this patient.
        </p>
      </div>
    );
  }

  return (
    <PatientVitalsView
      patientId={patientId}
      patientName={patient?.patient_name ?? 'Patient'}
      onBack={() => navigate('/family')}
      backLabel="← My Patient"
    />
  );
}