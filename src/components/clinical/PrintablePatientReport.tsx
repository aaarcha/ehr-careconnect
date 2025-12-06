import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface PrintablePatientReportProps {
  patient: {
    id: string;
    hospital_number: string;
    patient_number?: string;
    name: string;
    age: number;
    sex: string;
    date_of_birth: string;
    status: string;
    admit_to_department?: string | null;
    admit_to_location?: string;
    admitting_diagnosis?: string;
    contact_number?: string;
    address?: string;
    philhealth?: boolean;
    allergies?: string[];
    current_medications?: string[];
    problem_list?: string[];
    past_medical_history?: any;
    personal_social_history?: any;
    family_history?: any;
    history_of_present_illness?: string;
  };
  attendingDoctorName: string | null;
  vitalSigns: any[];
  assessments: any[];
  labs: any[];
  imaging: any[];
}

interface FDARNote {
  id: string;
  date_time: string;
  focus: string;
  data: string;
  action: string;
  response: string;
  notes: string;
  nurse_name: string;
}

interface MARRecord {
  id: string;
  date: string;
  medication_name: string;
  dose: string;
  route: string;
  scheduled_times: any;
  administered_times: any;
  nurse_initials: string;
  is_completed: boolean;
  room_no: string;
}

interface IORecord {
  id: string;
  time: string;
  record_type: string;
  type_description: string;
  amount: number;
  notes: string;
  recorded_by: string;
}

interface IVFluidRecord {
  id: string;
  date: string;
  room_no: string;
  bottle_no: number;
  iv_solution: string;
  running_time: string;
  time_started: string;
  expected_time_to_consume: string;
  remarks: string;
}

const PrintablePatientReport = ({ 
  patient, 
  attendingDoctorName,
  vitalSigns,
  assessments,
  labs,
  imaging 
}: PrintablePatientReportProps) => {
  const [fdarNotes, setFdarNotes] = useState<FDARNote[]>([]);
  const [marRecords, setMarRecords] = useState<MARRecord[]>([]);
  const [ioRecords, setIoRecords] = useState<IORecord[]>([]);
  const [ivFluidRecords, setIvFluidRecords] = useState<IVFluidRecord[]>([]);

  useEffect(() => {
    const fetchClinicalData = async () => {
      const [fdarResult, marResult, ioResult, ivResult] = await Promise.all([
        supabase.from('fdar_notes').select('*').eq('patient_id', patient.id).order('date_time', { ascending: false }),
        supabase.from('medication_administration_records').select('*').eq('patient_id', patient.id).order('date', { ascending: false }),
        supabase.from('intake_output_records').select('*').eq('patient_id', patient.id).order('time', { ascending: false }),
        supabase.from('iv_fluid_monitoring').select('*').eq('patient_id', patient.id).order('date', { ascending: false }),
      ]);

      setFdarNotes(fdarResult.data || []);
      setMarRecords(marResult.data || []);
      setIoRecords(ioResult.data || []);
      setIvFluidRecords(ivResult.data || []);
    };

    fetchClinicalData();
  }, [patient.id]);

  // Page Header Component - appears on each page
  const PageHeader = ({ pageTitle }: { pageTitle: string }) => (
    <div className="print-page-header mb-6">
      <div className="flex justify-between items-start border-b-2 border-black pb-3">
        <div>
          <h1 className="text-xl font-bold">{patient.name}</h1>
          <p className="text-sm">Hospital No: <span className="font-semibold">{patient.hospital_number}</span></p>
          <p className="text-sm">DOB: {format(new Date(patient.date_of_birth), 'MMM dd, yyyy')} | Age: {patient.age} | Sex: {patient.sex}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold">{pageTitle}</h2>
          <p className="text-sm">Attending: {attendingDoctorName || 'N/A'}</p>
          <p className="text-xs text-gray-600">Generated: {format(new Date(), 'MMM dd, yyyy h:mm a')}</p>
        </div>
      </div>
    </div>
  );

  // Helper for history sections
  const HistorySection = ({ title, history }: { title: string; history: any }) => {
    if (!history) return <p className="text-sm">No data documented.</p>;
    const entries = Object.entries(history).filter(([key]) => !['others', 'occupation'].includes(key));
    return (
      <div className="mb-3">
        <h4 className="font-semibold text-sm border-b mb-1">{title}</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {entries.map(([key, value]) => (
            <span key={key}>
              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
              {value === true ? 'Yes' : value === false ? 'No' : String(value) || 'N/A'}
            </span>
          ))}
        </div>
        {history.others && <p className="text-xs mt-1">Others: {history.others}</p>}
        {history.occupation && <p className="text-xs mt-1">Occupation: {history.occupation}</p>}
      </div>
    );
  };

  return (
    <div className="hidden print:block printable-report bg-white text-black">
      {/* PAGE 1: OVERVIEW */}
      <div className="print-page">
        <PageHeader pageTitle="Patient Overview" />
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p><span className="font-semibold">Status:</span> {patient.status?.toUpperCase()}</p>
            <p><span className="font-semibold">Department:</span> {patient.admit_to_department || 'N/A'}</p>
            <p><span className="font-semibold">Location:</span> {patient.admit_to_location || 'N/A'}</p>
            <p><span className="font-semibold">PhilHealth:</span> {patient.philhealth ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p><span className="font-semibold">Contact:</span> {patient.contact_number || 'N/A'}</p>
            <p><span className="font-semibold">Address:</span> {patient.address || 'N/A'}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-bold text-base border-b-2 mb-2">Admitting Diagnosis</h3>
          <p className="text-sm">{patient.admitting_diagnosis || 'N/A'}</p>
        </div>

        <div className="mb-4">
          <h3 className="font-bold text-base border-b-2 mb-2">History of Present Illness</h3>
          <p className="text-sm">{patient.history_of_present_illness || 'N/A'}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <h4 className="font-semibold text-sm border-b mb-1">Problem List</h4>
            {patient.problem_list?.length ? (
              <ul className="list-disc pl-4 text-xs">
                {patient.problem_list.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            ) : <p className="text-xs">None documented</p>}
          </div>
          <div>
            <h4 className="font-semibold text-sm border-b mb-1">Allergies</h4>
            {patient.allergies?.length ? (
              <ul className="list-disc pl-4 text-xs">
                {patient.allergies.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            ) : <p className="text-xs">None documented</p>}
          </div>
          <div>
            <h4 className="font-semibold text-sm border-b mb-1">Current Medications</h4>
            {patient.current_medications?.length ? (
              <ul className="list-disc pl-4 text-xs">
                {patient.current_medications.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            ) : <p className="text-xs">None documented</p>}
          </div>
        </div>

        <h3 className="font-bold text-base border-b-2 mb-2">Medical History</h3>
        <HistorySection title="Past Medical History" history={patient.past_medical_history} />
        <HistorySection title="Personal & Social History" history={patient.personal_social_history} />
        <HistorySection title="Family History" history={patient.family_history} />
      </div>

      {/* PAGE 2: CLINICAL NOTES (FDAR) */}
      <div className="print-page">
        <PageHeader pageTitle="Clinical Notes (FDAR)" />
        
        {fdarNotes.length > 0 ? (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left w-24">Date/Time</th>
                <th className="border p-2 text-left">Focus</th>
                <th className="border p-2 text-left">Data</th>
                <th className="border p-2 text-left">Action</th>
                <th className="border p-2 text-left">Response</th>
                <th className="border p-2 text-left w-20">Nurse</th>
              </tr>
            </thead>
            <tbody>
              {fdarNotes.map((note) => (
                <tr key={note.id} className="break-inside-avoid">
                  <td className="border p-2 align-top">{format(new Date(note.date_time), 'MMM dd, yyyy h:mm a')}</td>
                  <td className="border p-2 align-top font-medium">{note.focus}</td>
                  <td className="border p-2 align-top">{note.data || '-'}</td>
                  <td className="border p-2 align-top">{note.action || '-'}</td>
                  <td className="border p-2 align-top">{note.response || '-'}</td>
                  <td className="border p-2 align-top">{note.nurse_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-center py-8">No clinical notes recorded.</p>
        )}
      </div>

      {/* PAGE 3: MEDICATION ADMINISTRATION RECORD (MAR) */}
      <div className="print-page">
        <PageHeader pageTitle="Medication Administration Record (MAR)" />
        
        {marRecords.length > 0 ? (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Medication</th>
                <th className="border p-2 text-left">Dose</th>
                <th className="border p-2 text-left">Route</th>
                <th className="border p-2 text-left">Scheduled Times</th>
                <th className="border p-2 text-left">Administered</th>
                <th className="border p-2 text-left">Nurse</th>
                <th className="border p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {marRecords.map((record) => (
                <tr key={record.id} className="break-inside-avoid">
                  <td className="border p-2">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                  <td className="border p-2 font-medium">{record.medication_name}</td>
                  <td className="border p-2">{record.dose}</td>
                  <td className="border p-2">{record.route}</td>
                  <td className="border p-2">
                    {Array.isArray(record.scheduled_times) ? record.scheduled_times.join(', ') : '-'}
                  </td>
                  <td className="border p-2">
                    {Array.isArray(record.administered_times) ? record.administered_times.join(', ') : '-'}
                  </td>
                  <td className="border p-2">{record.nurse_initials || '-'}</td>
                  <td className="border p-2">{record.is_completed ? '✓ Complete' : 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-center py-8">No medication administration records.</p>
        )}
      </div>

      {/* PAGE 4: INTAKE & OUTPUT */}
      <div className="print-page">
        <PageHeader pageTitle="Intake & Output Record" />
        
        <div className="grid grid-cols-2 gap-4">
          {/* Intake */}
          <div>
            <h3 className="font-bold text-sm mb-2 bg-gray-100 p-2">INTAKE</h3>
            {ioRecords.filter(r => r.record_type === 'intake').length > 0 ? (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-1 text-left">Time</th>
                    <th className="border p-1 text-left">Type</th>
                    <th className="border p-1 text-right">Amount (mL)</th>
                    <th className="border p-1 text-left">By</th>
                  </tr>
                </thead>
                <tbody>
                  {ioRecords.filter(r => r.record_type === 'intake').map((record) => (
                    <tr key={record.id}>
                      <td className="border p-1">{format(new Date(record.time), 'h:mm a')}</td>
                      <td className="border p-1">{record.type_description}</td>
                      <td className="border p-1 text-right">{record.amount}</td>
                      <td className="border p-1">{record.recorded_by || '-'}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-100">
                    <td colSpan={2} className="border p-1">Total Intake</td>
                    <td className="border p-1 text-right">
                      {ioRecords.filter(r => r.record_type === 'intake').reduce((sum, r) => sum + r.amount, 0)} mL
                    </td>
                    <td className="border p-1"></td>
                  </tr>
                </tbody>
              </table>
            ) : <p className="text-xs text-center py-4">No intake records</p>}
          </div>

          {/* Output */}
          <div>
            <h3 className="font-bold text-sm mb-2 bg-gray-100 p-2">OUTPUT</h3>
            {ioRecords.filter(r => r.record_type === 'output').length > 0 ? (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-1 text-left">Time</th>
                    <th className="border p-1 text-left">Type</th>
                    <th className="border p-1 text-right">Amount (mL)</th>
                    <th className="border p-1 text-left">By</th>
                  </tr>
                </thead>
                <tbody>
                  {ioRecords.filter(r => r.record_type === 'output').map((record) => (
                    <tr key={record.id}>
                      <td className="border p-1">{format(new Date(record.time), 'h:mm a')}</td>
                      <td className="border p-1">{record.type_description}</td>
                      <td className="border p-1 text-right">{record.amount}</td>
                      <td className="border p-1">{record.recorded_by || '-'}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-100">
                    <td colSpan={2} className="border p-1">Total Output</td>
                    <td className="border p-1 text-right">
                      {ioRecords.filter(r => r.record_type === 'output').reduce((sum, r) => sum + r.amount, 0)} mL
                    </td>
                    <td className="border p-1"></td>
                  </tr>
                </tbody>
              </table>
            ) : <p className="text-xs text-center py-4">No output records</p>}
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 border text-sm">
          <strong>Fluid Balance:</strong>{' '}
          {ioRecords.filter(r => r.record_type === 'intake').reduce((sum, r) => sum + r.amount, 0) - 
           ioRecords.filter(r => r.record_type === 'output').reduce((sum, r) => sum + r.amount, 0)} mL
        </div>
      </div>

      {/* PAGE 5: IV FLUID MONITORING */}
      <div className="print-page">
        <PageHeader pageTitle="IV Fluid Monitoring" />
        
        {ivFluidRecords.length > 0 ? (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Room</th>
                <th className="border p-2 text-center">Bottle #</th>
                <th className="border p-2 text-left">IV Solution</th>
                <th className="border p-2 text-left">Running Time</th>
                <th className="border p-2 text-left">Time Started</th>
                <th className="border p-2 text-left">Expected Completion</th>
                <th className="border p-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {ivFluidRecords.map((record) => (
                <tr key={record.id} className="break-inside-avoid">
                  <td className="border p-2">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                  <td className="border p-2">{record.room_no || '-'}</td>
                  <td className="border p-2 text-center">{record.bottle_no || '-'}</td>
                  <td className="border p-2 font-medium">{record.iv_solution}</td>
                  <td className="border p-2">{record.running_time || '-'}</td>
                  <td className="border p-2">{record.time_started || '-'}</td>
                  <td className="border p-2">{record.expected_time_to_consume || '-'}</td>
                  <td className="border p-2">{record.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-center py-8">No IV fluid monitoring records.</p>
        )}
      </div>

      {/* PAGE 6: PHYSICAL ASSESSMENTS */}
      <div className="print-page">
        <PageHeader pageTitle="Physical Assessments" />
        
        {assessments.length > 0 ? (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="border p-3 break-inside-avoid">
                <h4 className="font-bold text-sm mb-2 border-b pb-1">
                  Assessment: {format(new Date(assessment.assessment_date), 'MMM dd, yyyy h:mm a')}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {assessment.skin_assessment && (
                    <div>
                      <h5 className="font-semibold">Skin</h5>
                      {Object.entries(assessment.skin_assessment).map(([k, v]) => (
                        <p key={k}><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span> {String(v) || 'N/A'}</p>
                      ))}
                    </div>
                  )}
                  {assessment.eent_assessment && (
                    <div>
                      <h5 className="font-semibold">EENT</h5>
                      {Object.entries(assessment.eent_assessment).map(([k, v]) => (
                        <p key={k}><span className="capitalize">{k}:</span> {String(v) || 'N/A'}</p>
                      ))}
                    </div>
                  )}
                  {assessment.cardiovascular_assessment && (
                    <div>
                      <h5 className="font-semibold">Cardiovascular</h5>
                      {Object.entries(assessment.cardiovascular_assessment).map(([k, v]) => (
                        <p key={k}><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span> {String(v) || 'N/A'}</p>
                      ))}
                    </div>
                  )}
                  {assessment.respiratory_assessment && (
                    <div>
                      <h5 className="font-semibold">Respiratory</h5>
                      {Object.entries(assessment.respiratory_assessment).map(([k, v]) => (
                        <p key={k}><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span> {String(v) || 'N/A'}</p>
                      ))}
                    </div>
                  )}
                  {assessment.gastrointestinal_assessment && (
                    <div>
                      <h5 className="font-semibold">Gastrointestinal</h5>
                      {Object.entries(assessment.gastrointestinal_assessment).map(([k, v]) => (
                        <p key={k}><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span> {String(v) || 'N/A'}</p>
                      ))}
                    </div>
                  )}
                  {assessment.genitourinary_assessment && (
                    <div>
                      <h5 className="font-semibold">Genitourinary</h5>
                      {Object.entries(assessment.genitourinary_assessment).map(([k, v]) => (
                        <p key={k}><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span> {String(v) || 'N/A'}</p>
                      ))}
                    </div>
                  )}
                  {assessment.musculoskeletal_assessment && (
                    <div>
                      <h5 className="font-semibold">Musculoskeletal</h5>
                      {Object.entries(assessment.musculoskeletal_assessment).map(([k, v]) => (
                        <p key={k}><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span> {String(v) || 'N/A'}</p>
                      ))}
                    </div>
                  )}
                  {assessment.neurological_assessment && (
                    <div>
                      <h5 className="font-semibold">Neurological</h5>
                      {Object.entries(assessment.neurological_assessment).map(([k, v]) => (
                        <p key={k}><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span> {String(v) || 'N/A'}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-8">No physical assessments recorded.</p>
        )}
      </div>

      {/* PAGE 7: VITAL SIGNS */}
      <div className="print-page">
        <PageHeader pageTitle="Vital Signs History" />
        
        {vitalSigns.length > 0 ? (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Date/Time</th>
                <th className="border p-2 text-center">BP</th>
                <th className="border p-2 text-center">HR</th>
                <th className="border p-2 text-center">RR</th>
                <th className="border p-2 text-center">Temp</th>
                <th className="border p-2 text-center">O₂ Sat</th>
                <th className="border p-2 text-center">Pain</th>
                <th className="border p-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {vitalSigns.map((vitals) => (
                <tr key={vitals.id} className="break-inside-avoid">
                  <td className="border p-2">{format(new Date(vitals.recorded_at), 'MMM dd, yyyy h:mm a')}</td>
                  <td className="border p-2 text-center">{vitals.blood_pressure || '-'}</td>
                  <td className="border p-2 text-center">{vitals.heart_rate || '-'}</td>
                  <td className="border p-2 text-center">{vitals.respiratory_rate || '-'}</td>
                  <td className="border p-2 text-center">{vitals.temperature ? `${vitals.temperature}°C` : '-'}</td>
                  <td className="border p-2 text-center">{vitals.oxygen_saturation ? `${vitals.oxygen_saturation}%` : '-'}</td>
                  <td className="border p-2 text-center">{vitals.pain_scale ?? '-'}</td>
                  <td className="border p-2">{vitals.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-center py-8">No vital signs recorded.</p>
        )}
      </div>

      {/* PAGE 8: LABORATORY RESULTS */}
      <div className="print-page">
        <PageHeader pageTitle="Laboratory Results" />
        
        {labs.length > 0 ? (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Test Name</th>
                <th className="border p-2 text-center">Result</th>
                <th className="border p-2 text-center">Unit</th>
                <th className="border p-2 text-center">Normal Range</th>
                <th className="border p-2 text-center">Flag</th>
                <th className="border p-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab) => (
                <tr key={lab.id} className={`break-inside-avoid ${lab.flag === 'HIGH' ? 'bg-red-50' : lab.flag === 'LOW' ? 'bg-green-50' : ''}`}>
                  <td className="border p-2">{format(new Date(lab.test_date), 'MMM dd, yyyy')}</td>
                  <td className="border p-2 font-medium">{lab.test_name}</td>
                  <td className="border p-2 text-center font-bold">{lab.result_value}</td>
                  <td className="border p-2 text-center">{lab.unit || '-'}</td>
                  <td className="border p-2 text-center">{lab.normal_range || '-'}</td>
                  <td className="border p-2 text-center font-bold">{lab.flag || '-'}</td>
                  <td className="border p-2">{lab.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-center py-8">No laboratory results recorded.</p>
        )}
      </div>

      {/* PAGE 9: IMAGING STUDIES */}
      <div className="print-page">
        <PageHeader pageTitle="Imaging Studies" />
        
        {imaging.length > 0 ? (
          <div className="space-y-3">
            {imaging.map((img) => (
              <div key={img.id} className="border p-3 break-inside-avoid">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-sm">{img.imaging_type}</h4>
                    <p className="text-xs text-gray-600">Category: {img.category || 'N/A'}</p>
                  </div>
                  <p className="text-xs">{format(new Date(img.imaging_date), 'MMM dd, yyyy')}</p>
                </div>
                <div className="text-xs">
                  <p><span className="font-semibold">Findings:</span> {img.findings || 'N/A'}</p>
                  {img.notes && <p className="mt-1"><span className="font-semibold">Notes:</span> {img.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-8">No imaging studies recorded.</p>
        )}
      </div>
    </div>
  );
};

export default PrintablePatientReport;
