import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, Eye } from "lucide-react";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    history_present_illness?: string;
  };
  attendingDoctorName: string | null;
  vitalSigns: any[];
  assessments: any[];
  labs: any[];
  imaging: any[];
}

type SectionKey = 'overview' | 'clinicalNotes' | 'mar' | 'io' | 'ivFluids' | 'assessments' | 'vitals' | 'labs' | 'imaging';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'overview', label: 'Patient Overview' },
  { key: 'clinicalNotes', label: 'Clinical Notes (FDAR)' },
  { key: 'mar', label: 'Medication Administration Record (MAR)' },
  { key: 'io', label: 'Intake & Output' },
  { key: 'ivFluids', label: 'IV Fluid Monitoring' },
  { key: 'assessments', label: 'Physical Assessments' },
  { key: 'vitals', label: 'Vital Signs' },
  { key: 'labs', label: 'Laboratory Results' },
  { key: 'imaging', label: 'Imaging Results' },
];

export const PrintPreviewDialog = ({
  open,
  onOpenChange,
  patient,
  attendingDoctorName,
  vitalSigns,
  assessments,
  labs,
  imaging,
}: PrintPreviewDialogProps) => {
  const [selectedSections, setSelectedSections] = useState<Record<SectionKey, boolean>>({
    overview: true,
    clinicalNotes: true,
    mar: true,
    io: true,
    ivFluids: true,
    assessments: true,
    vitals: true,
    labs: true,
    imaging: true,
  });

  const [fdarNotes, setFdarNotes] = useState<any[]>([]);
  const [marRecords, setMarRecords] = useState<any[]>([]);
  const [ioRecords, setIoRecords] = useState<any[]>([]);
  const [ivFluidRecords, setIvFluidRecords] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && patient.id) {
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
    }
  }, [open, patient.id]);

  const toggleSection = (key: SectionKey) => {
    setSelectedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    const allSelected: Record<SectionKey, boolean> = {} as Record<SectionKey, boolean>;
    SECTIONS.forEach(s => allSelected[s.key] = true);
    setSelectedSections(allSelected);
  };

  const deselectAll = () => {
    const allDeselected: Record<SectionKey, boolean> = {} as Record<SectionKey, boolean>;
    SECTIONS.forEach(s => allDeselected[s.key] = false);
    setSelectedSections(allDeselected);
  };

  // XSS sanitization helper - strips all HTML tags to prevent script injection
  const sanitize = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return DOMPurify.sanitize(String(value), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  };

  // Helper function to format JSON assessments into readable text
  const formatAssessment = (data: any): string => {
    if (!data) return 'N/A';
    if (typeof data === 'string') return sanitize(data);
    
    return Object.entries(data)
      .filter(([key, value]) => value && value !== '' && key !== 'notes')
      .map(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
        const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
        if (typeof value === 'boolean') {
          return `${sanitize(capitalizedKey)}: ${value ? 'Yes' : 'No'}`;
        }
        return `${sanitize(capitalizedKey)}: ${sanitize(String(value))}`;
      })
      .join(' | ');
  };

  // Helper to format MAR scheduled/administered times properly
  const formatMARTimes = (times: any): string => {
    if (!times) return '-';
    if (Array.isArray(times)) {
      if (times.length === 0) return '-';
      return times.map(t => {
        if (typeof t === 'object' && t !== null) {
          return sanitize(t.time || t.label || JSON.stringify(t));
        }
        return sanitize(String(t));
      }).join(', ');
    }
    if (typeof times === 'object') {
      return Object.values(times).map(v => sanitize(String(v))).join(', ');
    }
    return sanitize(String(times));
  };

  const generatePrintContent = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Report - ${patient.name}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #000; background: #fff; }
          .print-page { page-break-after: always; padding: 0.5in; min-height: 100vh; }
          .print-page:last-child { page-break-after: auto; }
          .page-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .page-header h1 { font-size: 18px; font-weight: bold; }
          .page-header h2 { font-size: 14px; font-weight: bold; }
          .page-header p { font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .section-title { font-size: 14px; font-weight: bold; border-bottom: 2px solid #000; margin-bottom: 8px; padding-bottom: 4px; }
          .subsection-title { font-size: 12px; font-weight: bold; background: #f0f0f0; padding: 4px 8px; margin-bottom: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
          .info-item { font-size: 11px; }
          .info-label { font-weight: bold; }
          .flag-high { background-color: #fef2f2; }
          .flag-low { background-color: #f0fdf4; }
          .no-data { text-align: center; padding: 24px; color: #666; }
          .summary-box { background: #f5f5f5; border: 1px solid #ddd; padding: 12px; margin-top: 12px; }
          ul { padding-left: 20px; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
          .assessment-card { border: 1px solid #ccc; padding: 12px; margin-bottom: 12px; border-radius: 4px; }
          .assessment-section { margin-bottom: 10px; }
          .assessment-label { font-weight: bold; color: #333; margin-bottom: 4px; }
          .assessment-value { padding-left: 10px; color: #555; }
          @page { margin: 0.5in; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${generateReportHTML()}
      </body>
      </html>
    `;
  };

  const generateReportHTML = () => {
    let html = '';
    
    const pageHeader = (title: string) => `
      <div class="page-header">
        <div>
          <h1>${sanitize(patient.name)}</h1>
          <p>Hospital No: <strong>${sanitize(patient.hospital_number)}</strong></p>
          <p>DOB: ${format(new Date(patient.date_of_birth), 'MMM dd, yyyy')} | Age: ${patient.age} | Sex: ${sanitize(patient.sex)}</p>
        </div>
        <div style="text-align: right;">
          <h2>${sanitize(title)}</h2>
          <p>Attending: ${sanitize(attendingDoctorName) || 'N/A'}</p>
          <p style="color: #666;">Generated: ${format(new Date(), 'MMM dd, yyyy h:mm a')}</p>
        </div>
      </div>
    `;

    // Overview
    if (selectedSections.overview) {
      html += `<div class="print-page">
        ${pageHeader('Patient Overview')}
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Status:</span> ${sanitize(patient.status?.toUpperCase()) || 'N/A'}</div>
          <div class="info-item"><span class="info-label">Department:</span> ${sanitize(patient.admit_to_department) || 'N/A'}</div>
          <div class="info-item"><span class="info-label">Location:</span> ${sanitize(patient.admit_to_location) || 'N/A'}</div>
          <div class="info-item"><span class="info-label">PhilHealth:</span> ${patient.philhealth ? 'Yes' : 'No'}</div>
          <div class="info-item"><span class="info-label">Contact:</span> ${sanitize(patient.contact_number) || 'N/A'}</div>
          <div class="info-item"><span class="info-label">Address:</span> ${sanitize(patient.address) || 'N/A'}</div>
        </div>
        <div class="section-title">Admitting Diagnosis</div>
        <p style="margin-bottom: 12px;">${sanitize(patient.admitting_diagnosis) || 'N/A'}</p>
        <div class="section-title">History of Present Illness</div>
        <p style="margin-bottom: 12px;">${sanitize(patient.history_present_illness) || 'N/A'}</p>
      </div>`;
    }

    // Clinical Notes
    if (selectedSections.clinicalNotes) {
      html += `<div class="print-page">
        ${pageHeader('Clinical Notes (FDAR)')}
        ${fdarNotes.length > 0 ? `
          <table>
            <thead><tr><th>Date/Time</th><th>Focus</th><th>Data</th><th>Action</th><th>Response</th><th>Nurse</th></tr></thead>
            <tbody>
              ${fdarNotes.map(note => `
                <tr>
                  <td>${format(new Date(note.date_time), 'MMM dd, yyyy h:mm a')}</td>
                  <td><strong>${sanitize(note.focus)}</strong></td>
                  <td>${sanitize(note.data) || '-'}</td>
                  <td>${sanitize(note.action) || '-'}</td>
                  <td>${sanitize(note.response) || '-'}</td>
                  <td>${sanitize(note.nurse_name) || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="no-data">No clinical notes recorded.</p>'}
      </div>`;
    }

    // MAR
    if (selectedSections.mar) {
      html += `<div class="print-page">
        ${pageHeader('Medication Administration Record (MAR)')}
        ${marRecords.length > 0 ? `
          <table>
            <thead><tr><th>Date</th><th>Medication</th><th>Dose</th><th>Route</th><th>Scheduled Times</th><th>Administered Times</th><th>Nurse</th><th>Status</th></tr></thead>
            <tbody>
              ${marRecords.map(record => `
                <tr>
                  <td>${format(new Date(record.date), 'MMM dd, yyyy')}</td>
                  <td><strong>${sanitize(record.medication_name)}</strong></td>
                  <td>${sanitize(record.dose)}</td>
                  <td>${sanitize(record.route)}</td>
                  <td>${formatMARTimes(record.scheduled_times)}</td>
                  <td>${formatMARTimes(record.administered_times)}</td>
                  <td>${sanitize(record.nurse_initials) || '-'}</td>
                  <td>${record.is_completed ? '✓ Complete' : 'Pending'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="no-data">No medication administration records.</p>'}
      </div>`;
    }

    // I&O
    if (selectedSections.io) {
      const intakeRecords = ioRecords.filter(r => r.record_type === 'intake');
      const outputRecords = ioRecords.filter(r => r.record_type === 'output');
      const totalIntake = intakeRecords.reduce((sum, r) => sum + r.amount, 0);
      const totalOutput = outputRecords.reduce((sum, r) => sum + r.amount, 0);
      
      html += `<div class="print-page">
        ${pageHeader('Intake & Output Record')}
        <div class="grid-2">
          <div>
            <div class="subsection-title">INTAKE</div>
            ${intakeRecords.length > 0 ? `
              <table>
                <thead><tr><th>Time</th><th>Type</th><th>Amount (mL)</th><th>By</th></tr></thead>
                <tbody>
                  ${intakeRecords.map(r => `
                    <tr><td>${format(new Date(r.time), 'h:mm a')}</td><td>${sanitize(r.type_description)}</td><td style="text-align: right;">${r.amount}</td><td>${sanitize(r.recorded_by) || '-'}</td></tr>
                  `).join('')}
                  <tr style="font-weight: bold; background: #f0f0f0;"><td colspan="2">Total Intake</td><td style="text-align: right;">${totalIntake} mL</td><td></td></tr>
                </tbody>
              </table>
            ` : '<p class="no-data">No intake records</p>'}
          </div>
          <div>
            <div class="subsection-title">OUTPUT</div>
            ${outputRecords.length > 0 ? `
              <table>
                <thead><tr><th>Time</th><th>Type</th><th>Amount (mL)</th><th>By</th></tr></thead>
                <tbody>
                  ${outputRecords.map(r => `
                    <tr><td>${format(new Date(r.time), 'h:mm a')}</td><td>${sanitize(r.type_description)}</td><td style="text-align: right;">${r.amount}</td><td>${sanitize(r.recorded_by) || '-'}</td></tr>
                  `).join('')}
                  <tr style="font-weight: bold; background: #f0f0f0;"><td colspan="2">Total Output</td><td style="text-align: right;">${totalOutput} mL</td><td></td></tr>
                </tbody>
              </table>
            ` : '<p class="no-data">No output records</p>'}
          </div>
        </div>
        <div class="summary-box"><strong>Fluid Balance:</strong> ${totalIntake - totalOutput} mL</div>
      </div>`;
    }

    // IV Fluids
    if (selectedSections.ivFluids) {
      html += `<div class="print-page">
        ${pageHeader('IV Fluid Monitoring')}
        ${ivFluidRecords.length > 0 ? `
          <table>
            <thead><tr><th>Date</th><th>Room</th><th>Bottle #</th><th>IV Solution</th><th>Running Time</th><th>Time Started</th><th>Expected</th><th>Remarks</th></tr></thead>
            <tbody>
              ${ivFluidRecords.map(r => `
                <tr>
                  <td>${format(new Date(r.date), 'MMM dd, yyyy')}</td>
                  <td>${sanitize(r.room_no) || '-'}</td>
                  <td style="text-align: center;">${r.bottle_no || '-'}</td>
                  <td><strong>${sanitize(r.iv_solution)}</strong></td>
                  <td>${sanitize(r.running_time) || '-'}</td>
                  <td>${sanitize(r.time_started) || '-'}</td>
                  <td>${sanitize(r.expected_time_to_consume) || '-'}</td>
                  <td>${sanitize(r.remarks) || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="no-data">No IV fluid monitoring records.</p>'}
      </div>`;
    }

    // Assessments - NOW WITH READABLE FORMAT
    if (selectedSections.assessments) {
      html += `<div class="print-page">
        ${pageHeader('Physical Assessments')}
        ${assessments.length > 0 ? assessments.map(a => `
          <div class="assessment-card break-inside-avoid">
            <div class="subsection-title">Assessment Date: ${format(new Date(a.assessment_date), 'MMM dd, yyyy h:mm a')}</div>
            ${a.skin_assessment ? `<div class="assessment-section"><div class="assessment-label">Skin Assessment:</div><div class="assessment-value">${formatAssessment(a.skin_assessment)}</div></div>` : ''}
            ${a.eent_assessment ? `<div class="assessment-section"><div class="assessment-label">EENT (Eyes, Ears, Nose, Throat):</div><div class="assessment-value">${formatAssessment(a.eent_assessment)}</div></div>` : ''}
            ${a.cardiovascular_assessment ? `<div class="assessment-section"><div class="assessment-label">Cardiovascular:</div><div class="assessment-value">${formatAssessment(a.cardiovascular_assessment)}</div></div>` : ''}
            ${a.respiratory_assessment ? `<div class="assessment-section"><div class="assessment-label">Respiratory:</div><div class="assessment-value">${formatAssessment(a.respiratory_assessment)}</div></div>` : ''}
            ${a.gastrointestinal_assessment ? `<div class="assessment-section"><div class="assessment-label">Gastrointestinal:</div><div class="assessment-value">${formatAssessment(a.gastrointestinal_assessment)}</div></div>` : ''}
            ${a.genitourinary_assessment ? `<div class="assessment-section"><div class="assessment-label">Genitourinary:</div><div class="assessment-value">${formatAssessment(a.genitourinary_assessment)}</div></div>` : ''}
            ${a.musculoskeletal_assessment ? `<div class="assessment-section"><div class="assessment-label">Musculoskeletal:</div><div class="assessment-value">${formatAssessment(a.musculoskeletal_assessment)}</div></div>` : ''}
            ${a.neurological_assessment ? `<div class="assessment-section"><div class="assessment-label">Neurological:</div><div class="assessment-value">${formatAssessment(a.neurological_assessment)}</div></div>` : ''}
          </div>
        `).join('') : '<p class="no-data">No physical assessments recorded.</p>'}
      </div>`;
    }

    // Vitals
    if (selectedSections.vitals) {
      html += `<div class="print-page">
        ${pageHeader('Vital Signs')}
        ${vitalSigns.length > 0 ? `
          <table>
            <thead><tr><th>Date/Time</th><th>BP</th><th>HR</th><th>RR</th><th>Temp</th><th>O2 Sat</th><th>Pain</th><th>Notes</th></tr></thead>
            <tbody>
              ${vitalSigns.map(vs => `
                <tr>
                  <td>${format(new Date(vs.recorded_at), 'MMM dd, yyyy h:mm a')}</td>
                  <td>${sanitize(vs.blood_pressure) || '-'}</td>
                  <td>${vs.heart_rate || '-'}</td>
                  <td>${vs.respiratory_rate || '-'}</td>
                  <td>${vs.temperature ? `${vs.temperature}°C` : '-'}</td>
                  <td>${vs.oxygen_saturation ? `${vs.oxygen_saturation}%` : '-'}</td>
                  <td>${vs.pain_scale !== null ? vs.pain_scale : '-'}</td>
                  <td>${sanitize(vs.notes) || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="no-data">No vital signs recorded.</p>'}
      </div>`;
    }

    // Labs
    if (selectedSections.labs) {
      html += `<div class="print-page">
        ${pageHeader('Laboratory Results')}
        ${labs.length > 0 ? `
          <table>
            <thead><tr><th>Date</th><th>Test Name</th><th>Result</th><th>Unit</th><th>Normal Range</th><th>Flag</th><th>Notes</th></tr></thead>
            <tbody>
              ${labs.map(lab => `
                <tr class="${lab.flag === 'HIGH' ? 'flag-high' : lab.flag === 'LOW' ? 'flag-low' : ''}">
                  <td>${lab.test_date ? format(new Date(lab.test_date), 'MMM dd, yyyy') : '-'}</td>
                  <td><strong>${sanitize(lab.test_name)}</strong></td>
                  <td>${lab.result_value ?? '-'}</td>
                  <td>${sanitize(lab.unit) || '-'}</td>
                  <td>${sanitize(lab.normal_range) || '-'}</td>
                  <td style="font-weight: bold; color: ${lab.flag === 'HIGH' ? '#dc2626' : lab.flag === 'LOW' ? '#16a34a' : 'inherit'};">${sanitize(lab.flag) || '-'}</td>
                  <td>${sanitize(lab.notes) || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="no-data">No laboratory results recorded.</p>'}
      </div>`;
    }

    // Imaging
    if (selectedSections.imaging) {
      html += `<div class="print-page">
        ${pageHeader('Imaging Results')}
        ${imaging.length > 0 ? `
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Findings</th><th>Notes</th></tr></thead>
            <tbody>
              ${imaging.map(img => `
                <tr>
                  <td>${img.imaging_date ? format(new Date(img.imaging_date), 'MMM dd, yyyy') : '-'}</td>
                  <td><strong>${sanitize(img.imaging_type)}</strong></td>
                  <td>${sanitize(img.category) || '-'}</td>
                  <td>${sanitize(img.findings) || '-'}</td>
                  <td>${sanitize(img.notes) || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="no-data">No imaging results recorded.</p>'}
      </div>`;
    }

    return html;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(generatePrintContent());
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const PageHeader = ({ pageTitle }: { pageTitle: string }) => (
    <div className="page-header">
      <div>
        <h1>{patient.name}</h1>
        <p>Hospital No: <strong>{patient.hospital_number}</strong></p>
        <p>DOB: {format(new Date(patient.date_of_birth), 'MMM dd, yyyy')} | Age: {patient.age} | Sex: {patient.sex}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <h2>{pageTitle}</h2>
        <p>Attending: {attendingDoctorName || 'N/A'}</p>
        <p style={{ color: '#666' }}>Generated: {format(new Date(), 'MMM dd, yyyy h:mm a')}</p>
      </div>
    </div>
  );

  const HistorySection = ({ title, history }: { title: string; history: any }) => {
    if (!history) return <p>No data documented.</p>;
    const entries = Object.entries(history).filter(([key]) => !['others', 'occupation'].includes(key));
    return (
      <div style={{ marginBottom: '12px' }}>
        <div className="subsection-title">{title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '10px' }}>
          {entries.map(([key, value]) => (
            <span key={key}>
              <strong style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
              {value === true ? 'Yes' : value === false ? 'No' : String(value) || 'N/A'}
            </span>
          ))}
        </div>
        {history.others && <p style={{ marginTop: '4px' }}>Others: {history.others}</p>}
        {history.occupation && <p style={{ marginTop: '4px' }}>Occupation: {history.occupation}</p>}
      </div>
    );
  };

  const selectedCount = Object.values(selectedSections).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Patient Report
          </DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Select the sections you want to include in the printed report:
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SECTIONS.map(({ key, label }) => (
                  <div
                    key={key}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSections[key] ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleSection(key)}
                  >
                    <Checkbox
                      id={key}
                      checked={selectedSections[key]}
                      onCheckedChange={() => toggleSection(key)}
                    />
                    <Label htmlFor={key} className="cursor-pointer text-sm font-medium">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                {selectedCount} of {SECTIONS.length} sections selected
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(true)}
                disabled={selectedCount === 0}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button 
                onClick={handlePrint}
                disabled={selectedCount === 0}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print ({selectedCount} sections)
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <ScrollArea className="flex-1 max-h-[60vh] border rounded-lg">
              <div ref={printRef} className="p-4 bg-white text-black text-xs">
                {/* OVERVIEW */}
                {selectedSections.overview && (
                  <div className="print-page">
                    <PageHeader pageTitle="Patient Overview" />
                    <div className="info-grid">
                      <div className="info-item"><span className="info-label">Status:</span> {patient.status?.toUpperCase()}</div>
                      <div className="info-item"><span className="info-label">Department:</span> {patient.admit_to_department || 'N/A'}</div>
                      <div className="info-item"><span className="info-label">Location:</span> {patient.admit_to_location || 'N/A'}</div>
                      <div className="info-item"><span className="info-label">PhilHealth:</span> {patient.philhealth ? 'Yes' : 'No'}</div>
                      <div className="info-item"><span className="info-label">Contact:</span> {patient.contact_number || 'N/A'}</div>
                      <div className="info-item"><span className="info-label">Address:</span> {patient.address || 'N/A'}</div>
                    </div>
                    <div className="section-title">Admitting Diagnosis</div>
                    <p style={{ marginBottom: '12px' }}>{patient.admitting_diagnosis || 'N/A'}</p>
                    <div className="section-title">History of Present Illness</div>
                    <p style={{ marginBottom: '12px' }}>{patient.history_present_illness || 'N/A'}</p>
                    <div className="section-title">Medical History</div>
                    <HistorySection title="Past Medical History" history={patient.past_medical_history} />
                    <HistorySection title="Personal & Social History" history={patient.personal_social_history} />
                    <HistorySection title="Family History" history={patient.family_history} />
                  </div>
                )}

                {/* CLINICAL NOTES */}
                {selectedSections.clinicalNotes && (
                  <div className="print-page">
                    <PageHeader pageTitle="Clinical Notes (FDAR)" />
                    {fdarNotes.length > 0 ? (
                      <table>
                        <thead>
                          <tr><th>Date/Time</th><th>Focus</th><th>Data</th><th>Action</th><th>Response</th><th>Nurse</th></tr>
                        </thead>
                        <tbody>
                          {fdarNotes.map((note: any) => (
                            <tr key={note.id} className="break-inside-avoid">
                              <td>{format(new Date(note.date_time), 'MMM dd, yyyy h:mm a')}</td>
                              <td><strong>{note.focus}</strong></td>
                              <td>{note.data || '-'}</td>
                              <td>{note.action || '-'}</td>
                              <td>{note.response || '-'}</td>
                              <td>{note.nurse_name || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="no-data">No clinical notes recorded.</p>}
                  </div>
                )}

                {/* MAR */}
                {selectedSections.mar && (
                  <div className="print-page">
                    <PageHeader pageTitle="Medication Administration Record (MAR)" />
                    {marRecords.length > 0 ? (
                      <table>
                        <thead>
                          <tr><th>Date</th><th>Medication</th><th>Dose</th><th>Route</th><th>Scheduled</th><th>Administered</th><th>Nurse</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {marRecords.map((record: any) => (
                            <tr key={record.id} className="break-inside-avoid">
                              <td>{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                              <td><strong>{record.medication_name}</strong></td>
                              <td>{record.dose}</td>
                              <td>{record.route}</td>
                              <td>{formatMARTimes(record.scheduled_times)}</td>
                              <td>{formatMARTimes(record.administered_times)}</td>
                              <td>{record.nurse_initials || '-'}</td>
                              <td>{record.is_completed ? '✓ Complete' : 'Pending'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="no-data">No medication administration records.</p>}
                  </div>
                )}

                {/* I&O */}
                {selectedSections.io && (
                  <div className="print-page">
                    <PageHeader pageTitle="Intake & Output Record" />
                    <div className="grid-2">
                      <div>
                        <div className="subsection-title">INTAKE</div>
                        {ioRecords.filter((r: any) => r.record_type === 'intake').length > 0 ? (
                          <table>
                            <thead><tr><th>Time</th><th>Type</th><th>Amount (mL)</th><th>By</th></tr></thead>
                            <tbody>
                              {ioRecords.filter((r: any) => r.record_type === 'intake').map((record: any) => (
                                <tr key={record.id}><td>{format(new Date(record.time), 'h:mm a')}</td><td>{record.type_description}</td><td style={{ textAlign: 'right' }}>{record.amount}</td><td>{record.recorded_by || '-'}</td></tr>
                              ))}
                              <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                                <td colSpan={2}>Total Intake</td>
                                <td style={{ textAlign: 'right' }}>{ioRecords.filter((r: any) => r.record_type === 'intake').reduce((sum: number, r: any) => sum + r.amount, 0)} mL</td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        ) : <p className="no-data">No intake records</p>}
                      </div>
                      <div>
                        <div className="subsection-title">OUTPUT</div>
                        {ioRecords.filter((r: any) => r.record_type === 'output').length > 0 ? (
                          <table>
                            <thead><tr><th>Time</th><th>Type</th><th>Amount (mL)</th><th>By</th></tr></thead>
                            <tbody>
                              {ioRecords.filter((r: any) => r.record_type === 'output').map((record: any) => (
                                <tr key={record.id}><td>{format(new Date(record.time), 'h:mm a')}</td><td>{record.type_description}</td><td style={{ textAlign: 'right' }}>{record.amount}</td><td>{record.recorded_by || '-'}</td></tr>
                              ))}
                              <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                                <td colSpan={2}>Total Output</td>
                                <td style={{ textAlign: 'right' }}>{ioRecords.filter((r: any) => r.record_type === 'output').reduce((sum: number, r: any) => sum + r.amount, 0)} mL</td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        ) : <p className="no-data">No output records</p>}
                      </div>
                    </div>
                    <div className="summary-box">
                      <strong>Fluid Balance:</strong>{' '}
                      {ioRecords.filter((r: any) => r.record_type === 'intake').reduce((sum: number, r: any) => sum + r.amount, 0) - 
                       ioRecords.filter((r: any) => r.record_type === 'output').reduce((sum: number, r: any) => sum + r.amount, 0)} mL
                    </div>
                  </div>
                )}

                {/* IV FLUIDS */}
                {selectedSections.ivFluids && (
                  <div className="print-page">
                    <PageHeader pageTitle="IV Fluid Monitoring" />
                    {ivFluidRecords.length > 0 ? (
                      <table>
                        <thead>
                          <tr><th>Date</th><th>Room</th><th>Bottle #</th><th>IV Solution</th><th>Running Time</th><th>Time Started</th><th>Expected</th><th>Remarks</th></tr>
                        </thead>
                        <tbody>
                          {ivFluidRecords.map((record: any) => (
                            <tr key={record.id} className="break-inside-avoid">
                              <td>{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                              <td>{record.room_no || '-'}</td>
                              <td style={{ textAlign: 'center' }}>{record.bottle_no || '-'}</td>
                              <td><strong>{record.iv_solution}</strong></td>
                              <td>{record.running_time || '-'}</td>
                              <td>{record.time_started || '-'}</td>
                              <td>{record.expected_time_to_consume || '-'}</td>
                              <td>{record.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="no-data">No IV fluid monitoring records.</p>}
                  </div>
                )}

                {/* ASSESSMENTS */}
                {selectedSections.assessments && (
                  <div className="print-page">
                    <PageHeader pageTitle="Physical Assessments" />
                    {assessments.length > 0 ? (
                      assessments.map((assessment: any) => (
                        <div key={assessment.id} className="break-inside-avoid" style={{ border: '1px solid #333', padding: '12px', marginBottom: '12px', borderRadius: '4px' }}>
                          <div className="subsection-title">Assessment Date: {format(new Date(assessment.assessment_date), 'MMM dd, yyyy h:mm a')}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            {assessment.skin_assessment && (
                              <div><strong>Skin Assessment:</strong> <span style={{ color: '#555' }}>{formatAssessment(assessment.skin_assessment)}</span></div>
                            )}
                            {assessment.eent_assessment && (
                              <div><strong>EENT (Eyes, Ears, Nose, Throat):</strong> <span style={{ color: '#555' }}>{formatAssessment(assessment.eent_assessment)}</span></div>
                            )}
                            {assessment.cardiovascular_assessment && (
                              <div><strong>Cardiovascular:</strong> <span style={{ color: '#555' }}>{formatAssessment(assessment.cardiovascular_assessment)}</span></div>
                            )}
                            {assessment.respiratory_assessment && (
                              <div><strong>Respiratory:</strong> <span style={{ color: '#555' }}>{formatAssessment(assessment.respiratory_assessment)}</span></div>
                            )}
                            {assessment.gastrointestinal_assessment && (
                              <div><strong>Gastrointestinal:</strong> <span style={{ color: '#555' }}>{formatAssessment(assessment.gastrointestinal_assessment)}</span></div>
                            )}
                            {assessment.genitourinary_assessment && (
                              <div><strong>Genitourinary:</strong> <span style={{ color: '#555' }}>{formatAssessment(assessment.genitourinary_assessment)}</span></div>
                            )}
                            {assessment.musculoskeletal_assessment && (
                              <div><strong>Musculoskeletal:</strong> <span style={{ color: '#555' }}>{formatAssessment(assessment.musculoskeletal_assessment)}</span></div>
                            )}
                            {assessment.neurological_assessment && (
                              <div><strong>Neurological:</strong> <span style={{ color: '#555' }}>{formatAssessment(assessment.neurological_assessment)}</span></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : <p className="no-data">No physical assessments recorded.</p>}
                  </div>
                )}

                {/* VITALS */}
                {selectedSections.vitals && (
                  <div className="print-page">
                    <PageHeader pageTitle="Vital Signs" />
                    {vitalSigns.length > 0 ? (
                      <table>
                        <thead>
                          <tr><th>Date/Time</th><th>BP</th><th>HR</th><th>RR</th><th>Temp</th><th>O2 Sat</th><th>Pain</th><th>Notes</th></tr>
                        </thead>
                        <tbody>
                          {vitalSigns.map((vs: any) => (
                            <tr key={vs.id} className="break-inside-avoid">
                              <td>{format(new Date(vs.recorded_at), 'MMM dd, yyyy h:mm a')}</td>
                              <td>{vs.blood_pressure || '-'}</td>
                              <td>{vs.heart_rate || '-'}</td>
                              <td>{vs.respiratory_rate || '-'}</td>
                              <td>{vs.temperature ? `${vs.temperature}°C` : '-'}</td>
                              <td>{vs.oxygen_saturation ? `${vs.oxygen_saturation}%` : '-'}</td>
                              <td>{vs.pain_scale !== null ? vs.pain_scale : '-'}</td>
                              <td>{vs.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="no-data">No vital signs recorded.</p>}
                  </div>
                )}

                {/* LABS */}
                {selectedSections.labs && (
                  <div className="print-page">
                    <PageHeader pageTitle="Laboratory Results" />
                    {labs.length > 0 ? (
                      <table>
                        <thead>
                          <tr><th>Date</th><th>Test Name</th><th>Result</th><th>Unit</th><th>Normal Range</th><th>Flag</th><th>Notes</th></tr>
                        </thead>
                        <tbody>
                          {labs.map((lab: any) => (
                            <tr key={lab.id} className={`break-inside-avoid ${lab.flag === 'HIGH' ? 'flag-high' : lab.flag === 'LOW' ? 'flag-low' : ''}`}>
                              <td>{lab.test_date ? format(new Date(lab.test_date), 'MMM dd, yyyy') : '-'}</td>
                              <td><strong>{lab.test_name}</strong></td>
                              <td>{lab.result_value ?? '-'}</td>
                              <td>{lab.unit || '-'}</td>
                              <td>{lab.normal_range || '-'}</td>
                              <td style={{ fontWeight: 'bold', color: lab.flag === 'HIGH' ? '#dc2626' : lab.flag === 'LOW' ? '#16a34a' : 'inherit' }}>{lab.flag || '-'}</td>
                              <td>{lab.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="no-data">No laboratory results recorded.</p>}
                  </div>
                )}

                {/* IMAGING */}
                {selectedSections.imaging && (
                  <div className="print-page">
                    <PageHeader pageTitle="Imaging Results" />
                    {imaging.length > 0 ? (
                      <table>
                        <thead>
                          <tr><th>Date</th><th>Type</th><th>Category</th><th>Findings</th><th>Notes</th></tr>
                        </thead>
                        <tbody>
                          {imaging.map((img: any) => (
                            <tr key={img.id} className="break-inside-avoid">
                              <td>{img.imaging_date ? format(new Date(img.imaging_date), 'MMM dd, yyyy') : '-'}</td>
                              <td><strong>{img.imaging_type}</strong></td>
                              <td>{img.category || '-'}</td>
                              <td>{img.findings || '-'}</td>
                              <td>{img.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="no-data">No imaging results recorded.</p>}
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back to Selection
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreviewDialog;
