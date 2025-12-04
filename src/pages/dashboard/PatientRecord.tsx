import { useEffect, useState, useCallback, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, UserPlus, ArchiveRestore, Archive, Edit, Trash2, Plus, Printer, Stethoscope } from "lucide-react";
import { FDARNotes } from "@/components/clinical/FDARNotes";
import { MedicationAdministration } from "@/components/clinical/MedicationAdministration";
import { IntakeOutputRecord } from "@/components/clinical/IntakeOutputRecord";
import { IVFluidMonitoring } from "@/components/clinical/IVFluidMonitoring";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type DepartmentType = "WARD" | "OR" | "ICU" | "ER" | "HEMO" | "OUT_PATIENT" | "IN_PATIENT";
type PatientStatus = "active" | "archived";

interface Doctor {
  id: string;
  name: string;
  license_number?: string;
  specialty?: string;
}

// FIX: Added [key: string]: any; for Supabase Json column compatibility
interface PastMedicalHistory {
  hypertension: boolean;
  heartDisease: boolean;
  bronchialAsthma: boolean;
  diabetes: boolean;
  cancer: boolean;
  tuberculosis: boolean;
  hepatitis: boolean;
  kidneyDisease: boolean;
  others: string;
  [key: string]: any; 
}

// FIX: Added [key: string]: any; for Supabase Json column compatibility
interface PersonalSocialHistory {
  smoker: boolean;
  alcoholic: boolean;
  occupation: string;
  [key: string]: any;
}

// FIX: Added [key: string]: any; for Supabase Json column compatibility
interface FamilyHistory {
  hypertension: boolean;
  diabetes: boolean;
  heartDisease: boolean;
  cancer: boolean;
  tuberculosis: boolean;
  others: string;
  [key: string]: any;
}

interface Patient {
  id: string;
  hospital_number: string;
  patient_number?: string
  name: string;
  age: number;
  sex: string;
  date_of_birth: string;
  status: PatientStatus;
  admit_to_department?: DepartmentType | null;
  admit_to_location?: string;
  admitting_diagnosis?: string;
  contact_number?: string;
  address?: string;
  philhealth?: boolean;
  attending_physician_id?: string;
  allergies?: string[];
  current_medications?: string[];
  problem_list?: string[];
  past_medical_history?: PastMedicalHistory;
  personal_social_history?: PersonalSocialHistory;
  family_history?: FamilyHistory;
  history_of_present_illness?: string;
}

interface AssessmentFormState {
  skinColor: string; skinTexture: string; skinTurgor: string; skinLesions: string; skinEdema: boolean; skinNotes: string;
  eyes: string; ears: string; nose: string; throat: string; eentNotes: string;
  heartRate: string; heartRhythm: string; heartSounds: string; peripheralPulses: string; capillaryRefill: string; cardiovascularNotes: string;
  respiratoryRate: string; breathSounds: string; chestExpansion: string; cough: string; sputum: string; respiratoryNotes: string;
  abdomen: string; bowelSounds: string; lastBowelMovement: string; appetite: string; giNotes: string;
  bladderPalpation: string; urinaryOutput: string; urinaryColor: string; guNotes: string;
  gait: string; rangeOfMotion: string; muscleStrength: string; jointSwelling: boolean; musculoskeletalNotes: string;
  consciousness: string; orientation: string; speech: string; pupils: string; motorFunction: string; sensoryFunction: string; reflexes: string; neurologicalNotes: string;
}

interface PhysicalAssessment {
  id: string;
  patient_id: string;
  assessment_date: string;
  skin_assessment: any;
  eent_assessment: any;
  cardiovascular_assessment: any;
  respiratory_assessment: any;
  gastrointestinal_assessment: any;
  genitourinary_assessment: any;
  musculoskeletal_assessment: any;
  neurological_assessment: any;
}

interface Lab {
  id: string;
  patient_id: string;
  test_date: string;
  test_name: string;
  result_value: number;
  unit: string;
  normal_range: string;
  notes: string;
  flag?: string;
}

interface Imaging {
  id: string;
  patient_id: string;
  imaging_date: string;
  imaging_type: string;
  findings: string;
  image_url?: string;
  category?: string;
  notes?: string;
  recommendation?: string; 
}

interface VitalSign {
    id: string;
    patient_id: string;
    blood_pressure: string;
    heart_rate: number;
    respiratory_rate: number;
    temperature: number;
    oxygen_saturation: number;
    pain_scale: number;
    notes: string;
    recorded_at: string;
    version?: number;
}

interface EditPatientForm {
  name: string;
  age: number;
  sex: string;
  date_of_birth: string;
  hospital_number: string;
  address?: string;
  contact_number?: string;
  philhealth: boolean;
  admit_to_department?: DepartmentType | null;
  admit_to_location?: string;
  admitting_diagnosis?: string;
  attending_physician_id?: string;
  allergies: string[];
  current_medications: string[];
  problem_list: string[];
  past_medical_history: PastMedicalHistory;
  personal_social_history: PersonalSocialHistory;
  family_history: FamilyHistory;
  history_of_present_illness?: string;
  vital_signs?: any;
}

// Custom type for type-safe deletion handler
type DeletableRecordTable = 'physical_assessments' | 'patient_vital_signs' | 'patient_labs' | 'patient_imaging';

// -----------------------------------------------------------------------------
// HELPER COMPONENTS
// -----------------------------------------------------------------------------

const HistorySectionDisplay = ({ title, history }: { title: string; history: PastMedicalHistory | PersonalSocialHistory | FamilyHistory | undefined | null }) => {
  if (!history) return null;

  const entries = Object.entries(history).filter(([key]) => key !== 'others' && key !== 'occupation' && key !== 'smoker' && key !== 'alcoholic');
  const otherNotes = (history as any).others || (history as any).occupation;
  const lifestyle = (history as any).smoker !== undefined ? `Smoker: ${history.smoker ? 'Yes' : 'No'}, Alcoholic: ${history.alcoholic ? 'Yes' : 'No'}` : null;
  const occupation = (history as any).occupation;

  return (
    <Card className="shadow-none border-t-4 border-l-0 border-r-0 border-b-0 border-primary/50">
      <CardHeader className="py-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="pt-1 pb-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center space-x-1">
              <span className="font-semibold text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <Badge variant={value ? "destructive" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>
            </div>
          ))}
        </div>
        {(lifestyle || occupation || otherNotes) && (
          <p className="text-sm mt-3 space-y-1">
            {lifestyle && <span className="block font-semibold text-muted-foreground">{lifestyle}</span>}
            {occupation && <span className="block font-semibold text-muted-foreground">Occupation: <span className="font-normal">{occupation}</span></span>}
            {otherNotes && <span className="block font-semibold text-muted-foreground">Other Conditions/Notes: <span className="font-normal">{otherNotes}</span></span>}
          </p>
        )}
        {entries.length === 0 && !otherNotes && !lifestyle && (
          <p className="text-muted-foreground text-sm">No details documented.</p>
        )}
      </CardContent>
    </Card>
  );
};

// -----------------------------------------------------------------------------
// PRINTABLE RECORD COMPONENT 
// -----------------------------------------------------------------------------

const PrintableRecord = ({ 
  patient, 
  vitalSigns, 
  assessments, 
  labs, 
  imaging,
  attendingDoctorName
}: { 
  patient: Patient, 
  vitalSigns: VitalSign[], 
  assessments: PhysicalAssessment[], 
  labs: Lab[], 
  imaging: Imaging[],
  attendingDoctorName: string | null
}) => {
    const DetailRowPrint = ({ label, value }: { label: string; value: string | number | undefined | null | boolean }) => (
        <div className="flex flex-col text-xs print:text-xs border-r px-2 last:border-r-0">
            <span className="font-semibold text-gray-700 print:text-gray-900">{label}</span>
            <span className="break-words font-medium">
              {value === true ? 'Yes' : value === false ? 'No' : value || 'N/A'}
            </span>
        </div>
    );

    const ArrayPrint = ({ label, items }: { label: string; items: string[] | undefined | null }) => (
        <div className="text-xs space-y-1">
            <h4 className="font-bold text-sm">{label}</h4>
            {(items || []).length > 0 ? (
                <ul className="list-disc pl-4">
                    {(items || []).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            ) : <p>None documented</p>}
        </div>
    );

    const AssessmentDetailsPrint = ({ title, data }: { title: string; data: any }) => (
      <div className="mb-4 break-inside-avoid">
        <h3 className="font-semibold text-sm mt-2 border-b-2 pb-1">{title}</h3>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-1">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <dt className="font-medium capitalize text-muted-foreground">
                {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}:
              </dt>
              <dd className="break-words font-medium">
                {typeof value === 'boolean'
                  ? value ? 'Yes' : 'No'
                  : (value as ReactNode) || 'N/A'} 
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );


    return (
        <div className="hidden print:block space-y-6 p-4 bg-white min-h-[95vh] text-black">
            
            <div className="border-b pb-3 mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold">{patient.name}</h1>
                    <p className="text-sm font-medium">Patient Record - Health Weave System</p>
                </div>
                <div className="text-right text-sm">
                    <p>Hosp No: <span className="font-bold">{patient.hospital_number}</span></p>
                    <p>Attending Physician: <span className="font-bold">{attendingDoctorName || "N/A"}</span></p>
                    <p>Date Generated: {format(new Date(), 'MMM dd, yyyy h:mm a')}</p>
                </div>
            </div>

            <div className="grid grid-cols-6 border-b pb-2">
                <DetailRowPrint label="DoB" value={format(new Date(patient.date_of_birth), 'PPP')} />
                <DetailRowPrint label="Age" value={patient.age} />
                <DetailRowPrint label="Sex" value={patient.sex} />
                <DetailRowPrint label="Status" value={patient.status.toUpperCase()} />
                <DetailRowPrint label="PhilHealth" value={patient.philhealth} />
                <DetailRowPrint label="Dept" value={patient.admit_to_department} />
            </div>

            <div className="grid grid-cols-2 border-b pb-2">
                <DetailRowPrint label="Admitting Diagnosis" value={patient.admitting_diagnosis} />
                <DetailRowPrint label="Address" value={patient.address} />
            </div>


            <h2 className="text-lg font-bold mt-4 border-b-2 pb-1">History & Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="col-span-3">
                    <h3 className="font-bold text-sm">History of Present Illness</h3>
                    <p className="italic">{patient.history_of_present_illness || "N/A"}</p>
                </div>
                <ArrayPrint label="Problem List" items={patient.problem_list} />
                <ArrayPrint label="Allergies" items={patient.allergies} />
                <ArrayPrint label="Current Medications" items={patient.current_medications as string[]} />
            </div>

            <h2 className="text-lg font-bold mt-4 border-b-2 pb-1">Medical Histories</h2>
            <div className="space-y-3 pt-2 break-inside-avoid">
                <HistorySectionDisplay title="Past Medical History" history={patient.past_medical_history} />
                <HistorySectionDisplay title="Personal & Social History" history={patient.personal_social_history} />
                <HistorySectionDisplay title="Family History" history={patient.family_history} />
            </div>
            
            <h2 className="text-lg font-bold mt-4 border-b-2 pb-1">Vital Signs History</h2>
            {vitalSigns.length > 0 ? (
                <div className="space-y-2">
                    {vitalSigns.map((vitals) => (
                        <div key={vitals.id} className="border p-2 rounded-md grid grid-cols-7 gap-2 text-xs break-inside-avoid">
                            <DetailRowPrint label="Time" value={format(new Date(vitals.recorded_at), "h:mm a")} />
                            <DetailRowPrint label="BP" value={vitals.blood_pressure} />
                            <DetailRowPrint label="HR" value={vitals.heart_rate} />
                            <DetailRowPrint label="RR" value={vitals.respiratory_rate} />
                            <DetailRowPrint label="Temp" value={`${vitals.temperature}°C`} />
                            <DetailRowPrint label="O₂ Sat" value={`${vitals.oxygen_saturation}%`} />
                            <DetailRowPrint label="Pain" value={vitals.pain_scale} />
                            {vitals.notes && <div className="col-span-7 pt-1"><DetailRowPrint label="Notes" value={vitals.notes} /></div>}
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm">No vital signs recorded.</p>}

            <div className="grid grid-cols-2 gap-4">
                <div className="break-inside-avoid">
                    <h2 className="text-lg font-bold mt-4 border-b-2 pb-1">Lab Results ({labs.length})</h2>
                    {labs.length > 0 ? (
                        <div className="text-xs space-y-1 pt-1">
                            {labs.map(lab => (
                                <div key={lab.id} className="border p-2 rounded-sm">
                                    <p className="font-bold">{lab.test_name} ({format(new Date(lab.test_date), "MMM dd, yyyy")})</p>
                                    <p className="text-sm">Result: <span className="font-bold">{lab.result_value} {lab.unit}</span> (Ref: {lab.normal_range})</p>
                                    {lab.notes && <p className="italic text-gray-600">Notes: {lab.notes}</p>}
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm">No lab results recorded.</p>}
                </div>
                
                <div className="break-inside-avoid">
                    <h2 className="text-lg font-bold mt-4 border-b-2 pb-1">Imaging Studies ({imaging.length})</h2>
                    {imaging.length > 0 ? (
                        <div className="text-xs space-y-1 pt-1">
                            {imaging.map(img => (
                                <div key={img.id} className="border p-2 rounded-sm">
                                    <p className="font-bold">{img.imaging_type} ({format(new Date(img.imaging_date), "MMM dd, yyyy")})</p>
                                    <p className="text-sm">Findings: {img.findings}</p>
                                    {img.notes && <p className="italic text-gray-600">Notes: {img.notes}</p>}
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm">No imaging recorded.</p>}
                </div>
            </div>

            <h2 className="text-lg font-bold mt-4 border-b-2 pb-1">Physical Assessments ({assessments.length})</h2>
            <div className="columns-2 space-y-4 pt-2">
                {assessments.map((assessment) => (
                    <div key={assessment.id} className="p-3 border rounded-lg break-inside-avoid">
                        <h3 className="text-base font-bold mb-2">Assessment from {format(new Date(assessment.assessment_date), "MMM dd, yyyy h:mm a")}</h3>
                        <Separator className="mb-2" />
                        <AssessmentDetailsPrint title="Skin Assessment" data={assessment.skin_assessment} />
                        <AssessmentDetailsPrint title="EENT Assessment" data={assessment.eent_assessment} />
                        <AssessmentDetailsPrint title="Cardiovascular" data={assessment.cardiovascular_assessment} />
                        <AssessmentDetailsPrint title="Respiratory" data={assessment.respiratory_assessment} />
                        <AssessmentDetailsPrint title="Gastrointestinal" data={assessment.gastrointestinal_assessment} />
                        <AssessmentDetailsPrint title="Genitourinary" data={assessment.genitourinary_assessment} />
                        <AssessmentDetailsPrint title="Musculoskeletal" data={assessment.musculoskeletal_assessment} />
                        <AssessmentDetailsPrint title="Neurological" data={assessment.neurological_assessment} />
                    </div>
                ))}
            </div>

        </div>
    )
}

// -----------------------------------------------------------------------------
// EditPatientDialog
// -----------------------------------------------------------------------------

const EditPatientDialog = ({ 
  open, 
  onOpenChange, 
  patient,
  doctors, 
  onSave,
  vitalSigns,
  onVitalSignsSave,
  onAssessmentSave 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  doctors: Doctor[]; 
  onSave: (data: EditPatientForm) => Promise<void>;
  vitalSigns: VitalSign[];
  onVitalSignsSave: () => Promise<void>;
  onAssessmentSave: () => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);
  
  const [problemListInput, setProblemListInput] = useState<string>('');
  const [allergiesInput, setAllergiesInput] = useState<string>('');
  const [medicationsInput, setMedicationsInput] = useState<string>('');


  const [assessmentForm, setAssessmentForm] = useState<AssessmentFormState>({
    skinColor: '', skinTexture: '', skinTurgor: '', skinLesions: '', skinEdema: false, skinNotes: '',
    eyes: '', ears: '', nose: '', throat: '', eentNotes: '',
    heartRate: '', heartRhythm: '', heartSounds: '', peripheralPulses: '', capillaryRefill: '', cardiovascularNotes: '',
    respiratoryRate: '', breathSounds: '', chestExpansion: '', cough: '', sputum: '', respiratoryNotes: '',
    abdomen: '', bowelSounds: '', lastBowelMovement: '', appetite: '', giNotes: '',
    bladderPalpation: '', urinaryOutput: '', urinaryColor: '', guNotes: '',
    gait: '', rangeOfMotion: '', muscleStrength: '', jointSwelling: false, musculoskeletalNotes: '',
    consciousness: '', orientation: '', speech: '', pupils: '', motorFunction: '', sensoryFunction: '', reflexes: '', neurologicalNotes: ''
  });

  const handleAssessmentChange = (key: keyof AssessmentFormState, value: any) => {
    setAssessmentForm(prev => ({ ...prev, [key]: value }));
  };


  const handleSaveAssessment = async () => {
    try {
      setLoading(true);
      
      const assessment = {
        patient_id: patient.id,
        assessment_date: new Date().toISOString(),
        skin_assessment: {
          color: assessmentForm.skinColor,
          texture: assessmentForm.skinTexture,
          turgor: assessmentForm.skinTurgor,
          lesions: assessmentForm.skinLesions,
          edema: assessmentForm.skinEdema,
          notes: assessmentForm.skinNotes
        },
        eent_assessment: {
          eyes: assessmentForm.eyes, ears: assessmentForm.ears, nose: assessmentForm.nose, throat: assessmentForm.throat, notes: assessmentForm.eentNotes
        },
        cardiovascular_assessment: {
          heart_rate: assessmentForm.heartRate, rhythm: assessmentForm.heartRhythm, heart_sounds: assessmentForm.heartSounds, peripheral_pulses: assessmentForm.peripheralPulses, capillary_refill: assessmentForm.capillaryRefill, notes: assessmentForm.cardiovascularNotes
        },
        respiratory_assessment: {
          respiratory_rate: assessmentForm.respiratoryRate, breath_sounds: assessmentForm.breathSounds, chest_expansion: assessmentForm.chestExpansion, cough: assessmentForm.cough, sputum: assessmentForm.sputum, notes: assessmentForm.respiratoryNotes
        },
        gastrointestinal_assessment: {
          abdomen: assessmentForm.abdomen, bowel_sounds: assessmentForm.bowelSounds, last_bowel_movement: assessmentForm.lastBowelMovement, appetite: assessmentForm.appetite, notes: assessmentForm.giNotes
        },
        genitourinary_assessment: {
          bladder_palpation: assessmentForm.bladderPalpation, urinary_output: assessmentForm.urinaryOutput, urinary_color: assessmentForm.urinaryColor, notes: assessmentForm.guNotes
        },
        musculoskeletal_assessment: {
          gait: assessmentForm.gait, range_of_motion: assessmentForm.rangeOfMotion, muscle_strength: assessmentForm.muscleStrength, joint_swelling: assessmentForm.jointSwelling, notes: assessmentForm.musculoskeletalNotes
        },
        neurological_assessment: {
          consciousness: assessmentForm.consciousness, orientation: assessmentForm.orientation, speech: assessmentForm.speech, pupils: assessmentForm.pupils, motor_function: assessmentForm.motorFunction, sensory_function: assessmentForm.sensoryFunction, reflexes: assessmentForm.reflexes, notes: assessmentForm.neurologicalNotes
        }
      };

      const { error } = await supabase
        .from('physical_assessments')
        .insert([assessment]);

      if (error) throw error;

      toast.success('Physical assessment saved successfully');
      onAssessmentSave();
      
      // Clear the form
      setAssessmentForm({
        skinColor: '', skinTexture: '', skinTurgor: '', skinLesions: '', skinEdema: false, skinNotes: '',
        eyes: '', ears: '', nose: '', throat: '', eentNotes: '',
        heartRate: '', heartRhythm: '', heartSounds: '', peripheralPulses: '', capillaryRefill: '', cardiovascularNotes: '',
        respiratoryRate: '', breathSounds: '', chestExpansion: '', cough: '', sputum: '', respiratoryNotes: '',
        abdomen: '', bowelSounds: '', lastBowelMovement: '', appetite: '', giNotes: '',
        bladderPalpation: '', urinaryOutput: '', urinaryColor: '', guNotes: '',
        gait: '', rangeOfMotion: '', muscleStrength: '', jointSwelling: false, musculoskeletalNotes: '',
        consciousness: '', orientation: '', speech: '', pupils: '', motorFunction: '', sensoryFunction: '', reflexes: '', neurologicalNotes: ''
      });

    } catch (error) {
      console.error('Error saving physical assessment:', error);
      toast.error('Failed to save physical assessment');
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState<EditPatientForm>(() => ({
    name: patient.name,
    age: patient.age,
    sex: patient.sex,
    date_of_birth: patient.date_of_birth,
    hospital_number: patient.hospital_number,
    address: patient.address,
    contact_number: patient.contact_number,
    philhealth: patient.philhealth || false,
    admit_to_department: patient.admit_to_department,
    admit_to_location: patient.admit_to_location,
    admitting_diagnosis: patient.admitting_diagnosis,
    attending_physician_id: patient.attending_physician_id,
    allergies: patient.allergies || [],
    current_medications: patient.current_medications || [],
    problem_list: patient.problem_list || [],
    past_medical_history: patient.past_medical_history || {
      hypertension: false, heartDisease: false, bronchialAsthma: false, diabetes: false,
      cancer: false, tuberculosis: false, hepatitis: false, kidneyDisease: false, others: "",
      // Satisfy index signature
      // @ts-ignore
      [Symbol('index_key')]: true 
    },
    personal_social_history: patient.personal_social_history || {
      smoker: false, alcoholic: false, occupation: "",
      // Satisfy index signature
      // @ts-ignore
      [Symbol('index_key')]: true 
    },
    family_history: patient.family_history || {
      hypertension: false, diabetes: false, heartDisease: false, cancer: false, tuberculosis: false, others: "",
      // Satisfy index signature
      // @ts-ignore
      [Symbol('index_key')]: true 
    },
    history_of_present_illness: patient.history_of_present_illness,
    vital_signs: {}
  }));

  // Update formData and local input strings when patient prop changes
  useEffect(() => {
    setFormData({
      name: patient.name,
      age: patient.age,
      sex: patient.sex,
      date_of_birth: patient.date_of_birth,
      hospital_number: patient.hospital_number,
      address: patient.address,
      contact_number: patient.contact_number,
      philhealth: patient.philhealth || false,
      admit_to_department: patient.admit_to_department,
      admit_to_location: patient.admit_to_location,
      admitting_diagnosis: patient.admitting_diagnosis,
      attending_physician_id: patient.attending_physician_id,
      allergies: patient.allergies || [],
      current_medications: patient.current_medications || [],
      problem_list: patient.problem_list || [],
      past_medical_history: patient.past_medical_history || {
        hypertension: false, heartDisease: false, bronchialAsthma: false, diabetes: false,
        cancer: false, tuberculosis: false, hepatitis: false, kidneyDisease: false, others: "",
        [Symbol('index_key')]: true 
      },
      personal_social_history: patient.personal_social_history || {
        smoker: false, alcoholic: false, occupation: "",
        [Symbol('index_key')]: true 
      },
      family_history: patient.family_history || {
        hypertension: false, diabetes: false, heartDisease: false, cancer: false, tuberculosis: false, others: "",
        [Symbol('index_key')]: true 
      },
      history_of_present_illness: patient.history_of_present_illness,
      vital_signs: vitalSigns[0] || {}
    });
    
    // Initialize local string states from array data for free typing
    setProblemListInput((patient.problem_list || []).join(', '));
    setAllergiesInput((patient.allergies || []).join(', '));
    setMedicationsInput((patient.current_medications || []).join(', '));

  }, [patient, vitalSigns]);


  const handleInputChange = (field: keyof EditPatientForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (
    inputField: 'problemListInput' | 'allergiesInput' | 'medicationsInput',
    value: string
  ) => {
    if (inputField === 'problemListInput') setProblemListInput(value);
    if (inputField === 'allergiesInput') setAllergiesInput(value);
    if (inputField === 'medicationsInput') setMedicationsInput(value);
  };


  const handleNestedHistoryChange = (
    field: 'past_medical_history' | 'personal_social_history' | 'family_history', 
    key: string, 
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] || {}),
        [key]: value
      } as any 
    }));
  };

  const handleVitalSignChange = (key: keyof VitalSign | 'notes' | 'blood_pressure', value: any) => {
    setFormData(prev => ({
      ...prev,
      vital_signs: {
        ...(prev.vital_signs || {}),
        [key]: value
      }
    }));
  };

  const handleSaveVitals = async ({ createNewVersion }: { createNewVersion: boolean }) => {
    try {
      setLoading(true);

      const latestVersion = vitalSigns.reduce((max, vs) => Math.max(max, vs.version || 0), 0);
      
      const vitalSignPayload = {
        patient_id: patient.id,
        blood_pressure: formData.vital_signs?.blood_pressure || null,
        heart_rate: formData.vital_signs?.heart_rate || null,
        respiratory_rate: formData.vital_signs?.respiratory_rate || null,
        temperature: formData.vital_signs?.temperature || null,
        oxygen_saturation: formData.vital_signs?.oxygen_saturation || null,
        pain_scale: formData.vital_signs?.pain_scale || null,
        notes: formData.vital_signs?.notes || '',
        recorded_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("patient_vital_signs")
        .insert(vitalSignPayload);

      if (error) throw error;

      toast.success(`Vital signs ${createNewVersion ? 'saved as new version' : 'updated'} successfully`);
      await onVitalSignsSave();
    } catch (error: any) {
      toast.error("Error saving vital signs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const parseStringToArray = (input: string) => input
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

      const dataToSave: EditPatientForm = {
        ...formData,
        problem_list: parseStringToArray(problemListInput),
        allergies: parseStringToArray(allergiesInput),
        current_medications: parseStringToArray(medicationsInput),
      };

      await onSave(dataToSave);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving patient:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Patient Record</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-2">
            <Tabs defaultValue="demographics">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="demographics">Demographics</TabsTrigger>
                <TabsTrigger value="vitals">Vital Signs & History</TabsTrigger>
                <TabsTrigger value="assessment">Physical Assessment</TabsTrigger>
              </TabsList>

              <TabsContent value="demographics">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="demographics">
                    <AccordionTrigger>Patient Information</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="hospitalNumber">Hospital Number *</Label>
                          <Input
                            id="hospitalNumber"
                            value={formData.hospital_number}
                            onChange={(e) => handleInputChange("hospital_number", e.target.value)}
                            placeholder="e.g., H2025001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input 
                            id="name" 
                            value={formData.name} 
                            onChange={(e) => handleInputChange("name", e.target.value)} 
                            placeholder="Last Name, First Name M.I." 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sex">Sex *</Label>
                          <Select value={formData.sex} onValueChange={(value) => handleInputChange("sex", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input id="age" value={formData.age} disabled placeholder="Auto-calculated" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className={cn("w-full justify-start text-left font-normal", !formData.date_of_birth && "text-muted-foreground")}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.date_of_birth ? format(new Date(formData.date_of_birth), "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar 
                                mode="single" 
                                selected={formData.date_of_birth ? new Date(formData.date_of_birth) : undefined} 
                                onSelect={(date) => {
                                  if (date) {
                                    handleInputChange("date_of_birth", format(date, "yyyy-MM-dd"));
                                    handleInputChange("age", differenceInYears(new Date(), date));
                                  }
                                }} 
                                captionLayout="dropdown" 
                                fromYear={1900} 
                                toYear={new Date().getFullYear()} 
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input 
                            id="address" 
                            value={formData.address || ""} 
                            onChange={(e) => handleInputChange("address", e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact">Contact Number</Label>
                          <Input 
                            id="contact" 
                            value={formData.contact_number || ""} 
                            onChange={(e) => handleInputChange("contact_number", e.target.value)} 
                            placeholder="+63 XXX XXX XXXX" 
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="philhealth" 
                              checked={formData.philhealth} 
                              onCheckedChange={(checked) => handleInputChange("philhealth", checked)} 
                            />
                            <Label htmlFor="philhealth">PhilHealth Member</Label>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="admission">
                    <AccordionTrigger>Admission Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="attendingDoctor">Attending Doctor</Label>
                          <Select 
                            value={formData.attending_physician_id || ""} 
                            onValueChange={(value) => handleInputChange("attending_physician_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assign Attending Doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              {doctors.map(doctor => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admitting_diagnosis">Admitting Diagnosis</Label>
                          <Textarea 
                            id="admitting_diagnosis" 
                            value={formData.admitting_diagnosis || ""} 
                            onChange={(e) => handleInputChange("admitting_diagnosis", e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department">Admit to Department</Label>
                          <Select 
                            value={formData.admit_to_department || ""} 
                            onValueChange={(value) => handleInputChange("admit_to_department", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WARD">WARD</SelectItem>
                              <SelectItem value="OR">OR</SelectItem>
                              <SelectItem value="ICU">ICU</SelectItem>
                              <SelectItem value="ER">ER</SelectItem>
                              <SelectItem value="HEMO">HEMO</SelectItem>
                              <SelectItem value="OUT_PATIENT">OUT PATIENT</SelectItem>
                              <SelectItem value="IN_PATIENT">IN PATIENT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location/Room</Label>
                          <Input 
                            id="location" 
                            value={formData.admit_to_location || ""} 
                            onChange={(e) => handleInputChange("admit_to_location", e.target.value)} 
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              <TabsContent value="vitals">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="vitals">
                    <AccordionTrigger>Vital Signs</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="blood_pressure">Blood Pressure (mmHg)</Label>
                          <Input 
                            id="blood_pressure" 
                            value={formData.vital_signs?.blood_pressure || ""} 
                            onChange={(e) => handleVitalSignChange("blood_pressure", e.target.value)} 
                            placeholder="120/80" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                          <Input 
                            id="heart_rate" 
                            type="number" 
                            value={formData.vital_signs?.heart_rate || ""} 
                            onChange={(e) => handleVitalSignChange("heart_rate", parseInt(e.target.value))} 
                            placeholder="80" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="respiratory_rate">Respiratory Rate (rpm)</Label>
                          <Input 
                            id="respiratory_rate" 
                            type="number" 
                            value={formData.vital_signs?.respiratory_rate || ""} 
                            onChange={(e) => handleVitalSignChange("respiratory_rate", parseInt(e.target.value))} 
                            placeholder="16" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="oxygen_saturation">O₂ Saturation (%)</Label>
                          <Input 
                            id="oxygen_saturation" 
                            type="number" 
                            value={formData.vital_signs?.oxygen_saturation || ""} 
                            onChange={(e) => handleVitalSignChange("oxygen_saturation", parseInt(e.target.value))} 
                            placeholder="98" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="temperature">Temperature (°C)</Label>
                          <Input 
                            id="temperature" 
                            type="number" 
                            step="0.1" 
                            value={formData.vital_signs?.temperature || ""} 
                            onChange={(e) => handleVitalSignChange("temperature", parseFloat(e.target.value))} 
                            placeholder="36.8" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pain_scale">Pain Scale (0-10)</Label>
                          <Input 
                            id="pain_scale" 
                            type="number" 
                            min="0" 
                            max="10" 
                            value={formData.vital_signs?.pain_scale || ""} 
                            onChange={(e) => handleVitalSignChange("pain_scale", parseInt(e.target.value))} 
                            placeholder="0" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="vitalsNotes">Additional Notes</Label>
                        <Textarea 
                          id="vitalsNotes" 
                          value={formData.vital_signs?.notes || ""} 
                          onChange={(e) => handleVitalSignChange("notes", e.target.value)} 
                          rows={3} 
                        />
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => handleSaveVitals({ createNewVersion: true })} 
                          disabled={loading}
                        >
                          Save as New Version
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="history">
                    <AccordionTrigger>Medical History</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="history_of_present_illness">History of Present Illness</Label>
                          <Textarea 
                            id="history_of_present_illness" 
                            value={formData.history_of_present_illness || ""} 
                            onChange={(e) => handleInputChange("history_of_present_illness", e.target.value)} 
                            rows={4} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Past Medical History</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(formData.past_medical_history || {}).map(([key, value]) => 
                              key === 'others' || key === 'index_key' ? null : (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={key} 
                                    checked={value as boolean} 
                                    onCheckedChange={(checked) => handleNestedHistoryChange('past_medical_history', key, checked)}
                                  />
                                  <label htmlFor={key} className="text-sm capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </label>
                                </div>
                              )
                            )}
                          </div>
                          <Label className="mt-4">Other Conditions</Label>
                          <Input 
                            id="pmhOthers" 
                            value={formData.past_medical_history?.others || ""} 
                            onChange={(e) => handleNestedHistoryChange('past_medical_history', 'others', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Personal & Social History</Label>
                          <div className="flex gap-6">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="smoker" 
                                checked={formData.personal_social_history?.smoker} 
                                onCheckedChange={(checked) => handleNestedHistoryChange('personal_social_history', 'smoker', checked)} 
                              />
                              <Label htmlFor="smoker">Smoker</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="alcoholic" 
                                checked={formData.personal_social_history?.alcoholic} 
                                onCheckedChange={(checked) => handleNestedHistoryChange('personal_social_history', 'alcoholic', checked)} 
                              />
                              <Label htmlFor="alcoholic">Drinks Alcohol</Label>
                            </div>
                          </div>
                          <div className="space-y-2 mt-2">
                            <Label htmlFor="occupation">Occupation</Label>
                            <Input 
                              id="occupation" 
                              value={formData.personal_social_history?.occupation || ""} 
                              onChange={(e) => handleNestedHistoryChange('personal_social_history', 'occupation', e.target.value)} 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Family History</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(formData.family_history || {}).map(([key, value]) => 
                              key === 'others' || key === 'index_key' ? null : (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`fh-${key}`} 
                                    checked={value as boolean} 
                                    onCheckedChange={(checked) => handleNestedHistoryChange('family_history', key, checked)}
                                  />
                                  <label htmlFor={`fh-${key}`} className="text-sm capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </label>
                                </div>
                              )
                            )}
                          </div>
                          <Label className="mt-4">Other Conditions</Label>
                          <Input 
                            id="fhOthers" 
                            value={formData.family_history?.others || ""} 
                            onChange={(e) => handleNestedHistoryChange('family_history', 'others', e.target.value)} 
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="problems">
                    <AccordionTrigger>Problem List & Medications</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <Label htmlFor="problemList">Problem List (comma-separated)</Label>
                        <Textarea 
                          id="problemList" 
                          value={problemListInput} 
                          onChange={(e) => handleArrayInputChange('problemListInput', e.target.value)} 
                          placeholder="e.g., Hypertension, Diabetes Mellitus Type 2" 
                          rows={3}
                        />

                        <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                        <Textarea 
                          id="allergies" 
                          value={allergiesInput} 
                          onChange={(e) => handleArrayInputChange('allergiesInput', e.target.value)} 
                          placeholder="e.g., Penicillin, Shellfish" 
                          rows={3}
                        />

                        <Label htmlFor="currentMedications">Current Medications (comma-separated)</Label>
                        <Textarea 
                          id="currentMedications" 
                          value={medicationsInput} 
                          onChange={(e) => handleArrayInputChange('medicationsInput', e.target.value)} 
                          placeholder="e.g., Metformin 500mg, Lisinopril 10mg" 
                          rows={3}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="assessment">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="skin">
                    <AccordionTrigger>Skin Assessment</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="skinColor">Color</Label>
                          <Input id="skinColor" value={assessmentForm.skinColor} onChange={(e) => handleAssessmentChange('skinColor', e.target.value)} placeholder="e.g., Pink, Pale, Cyanotic" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skinTexture">Texture</Label>
                          <Input id="skinTexture" value={assessmentForm.skinTexture} onChange={(e) => handleAssessmentChange('skinTexture', e.target.value)} placeholder="e.g., Smooth, Rough, Dry" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skinTurgor">Turgor</Label>
                          <Input id="skinTurgor" value={assessmentForm.skinTurgor} onChange={(e) => handleAssessmentChange('skinTurgor', e.target.value)} placeholder="e.g., Good, Poor" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skinLesions">Lesions</Label>
                          <Input id="skinLesions" value={assessmentForm.skinLesions} onChange={(e) => handleAssessmentChange('skinLesions', e.target.value)} placeholder="Describe any lesions" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="skinEdema" checked={assessmentForm.skinEdema} onCheckedChange={(checked: boolean) => handleAssessmentChange('skinEdema', checked)} />
                          <Label htmlFor="skinEdema">Edema present</Label>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="skinNotes">Additional Notes</Label>
                        <Textarea id="skinNotes" value={assessmentForm.skinNotes} onChange={(e) => handleAssessmentChange('skinNotes', e.target.value)} rows={3} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="eent">
                    <AccordionTrigger>EENT Assessment</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="eyes">Eyes</Label>
                          <Input id="eyes" value={assessmentForm.eyes} onChange={(e) => handleAssessmentChange('eyes', e.target.value)} placeholder="PERRLA, conjunctiva, sclera" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ears">Ears</Label>
                          <Input id="ears" value={assessmentForm.ears} onChange={(e) => handleAssessmentChange('ears', e.target.value)} placeholder="Hearing, discharge, tympanic membrane" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nose">Nose</Label>
                          <Input id="nose" value={assessmentForm.nose} onChange={(e) => handleAssessmentChange('nose', e.target.value)} placeholder="Discharge, septum, turbinates" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="throat">Throat</Label>
                          <Input id="throat" value={assessmentForm.throat} onChange={(e) => handleAssessmentChange('throat', e.target.value)} placeholder="Pharynx, tonsils, uvula" />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="eentNotes">Additional Notes</Label>
                        <Textarea id="eentNotes" value={assessmentForm.eentNotes} onChange={(e) => handleAssessmentChange('eentNotes', e.target.value)} rows={3} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cardio">
                    <AccordionTrigger>Cardiovascular</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="heartRate">Heart Rate</Label>
                          <Input id="heartRate" value={assessmentForm.heartRate} onChange={(e) => handleAssessmentChange('heartRate', e.target.value)} placeholder="e.g., 72 bpm" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heartRhythm">Rhythm</Label>
                          <Input id="heartRhythm" value={assessmentForm.heartRhythm} onChange={(e) => handleAssessmentChange('heartRhythm', e.target.value)} placeholder="Regular, Irregular" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heartSounds">Heart Sounds</Label>
                          <Input id="heartSounds" value={assessmentForm.heartSounds} onChange={(e) => handleAssessmentChange('heartSounds', e.target.value)} placeholder="S1, S2, murmurs" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="peripheralPulses">Peripheral Pulses</Label>
                          <Input id="peripheralPulses" value={assessmentForm.peripheralPulses} onChange={(e) => handleAssessmentChange('peripheralPulses', e.target.value)} placeholder="Radial, pedal, etc." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capillaryRefill">Capillary Refill</Label>
                          <Input id="capillaryRefill" value={assessmentForm.capillaryRefill} onChange={(e) => handleAssessmentChange('capillaryRefill', e.target.value)} placeholder="<2 seconds, delayed" />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="cardiovascularNotes">Additional Notes</Label>
                        <Textarea id="cardiovascularNotes" value={assessmentForm.cardiovascularNotes} onChange={(e) => handleAssessmentChange('cardiovascularNotes', e.target.value)} rows={3} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="respiratory">
                    <AccordionTrigger>Respiratory</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
                          <Input id="respiratoryRate" value={assessmentForm.respiratoryRate} onChange={(e) => handleAssessmentChange('respiratoryRate', e.target.value)} placeholder="e.g., 16/min" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="breathSounds">Breath Sounds</Label>
                          <Input id="breathSounds" value={assessmentForm.breathSounds} onChange={(e) => handleAssessmentChange('breathSounds', e.target.value)} placeholder="Clear, crackles, wheezes" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chestExpansion">Chest Expansion</Label>
                          <Input id="chestExpansion" value={assessmentForm.chestExpansion} onChange={(e) => handleAssessmentChange('chestExpansion', e.target.value)} placeholder="Symmetrical, asymmetrical" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cough">Cough</Label>
                          <Input id="cough" value={assessmentForm.cough} onChange={(e) => handleAssessmentChange('cough', e.target.value)} placeholder="Productive, non-productive" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sputum">Sputum</Label>
                          <Input id="sputum" value={assessmentForm.sputum} onChange={(e) => handleAssessmentChange('sputum', e.target.value)} placeholder="Color, consistency" />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="respiratoryNotes">Additional Notes</Label>
                        <Textarea id="respiratoryNotes" value={assessmentForm.respiratoryNotes} onChange={(e) => handleAssessmentChange('respiratoryNotes', e.target.value)} rows={3} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="gi">
                    <AccordionTrigger>Gastrointestinal</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="abdomen">Abdomen</Label>
                          <Input id="abdomen" value={assessmentForm.abdomen} onChange={(e) => handleAssessmentChange('abdomen', e.target.value)} placeholder="Soft, distended, tender" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bowelSounds">Bowel Sounds</Label>
                          <Input id="bowelSounds" value={assessmentForm.bowelSounds} onChange={(e) => handleAssessmentChange('bowelSounds', e.target.value)} placeholder="Active, hypoactive, hyperactive" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastBowelMovement">Last Bowel Movement</Label>
                          <Input id="lastBowelMovement" value={assessmentForm.lastBowelMovement} onChange={(e) => handleAssessmentChange('lastBowelMovement', e.target.value)} placeholder="Date/time" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="appetite">Appetite</Label>
                          <Input id="appetite" value={assessmentForm.appetite} onChange={(e) => handleAssessmentChange('appetite', e.target.value)} placeholder="Good, poor, nausea/vomiting" />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="giNotes">Additional Notes</Label>
                        <Textarea id="giNotes" value={assessmentForm.giNotes} onChange={(e) => handleAssessmentChange('giNotes', e.target.value)} rows={3} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="gu">
                    <AccordionTrigger>Genitourinary</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bladderPalpation">Bladder Palpation</Label>
                          <Input id="bladderPalpation" value={assessmentForm.bladderPalpation} onChange={(e) => handleAssessmentChange('bladderPalpation', e.target.value)} placeholder="Non-distended, distended" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="urinaryOutput">Urinary Output</Label>
                          <Input id="urinaryOutput" value={assessmentForm.urinaryOutput} onChange={(e) => handleAssessmentChange('urinaryOutput', e.target.value)} placeholder="Amount, frequency" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="urinaryColor">Urine Color</Label>
                          <Input id="urinaryColor" value={assessmentForm.urinaryColor} onChange={(e) => handleAssessmentChange('urinaryColor', e.target.value)} placeholder="Clear, amber, cloudy" />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="guNotes">Additional Notes</Label>
                        <Textarea id="guNotes" value={assessmentForm.guNotes} onChange={(e) => handleAssessmentChange('guNotes', e.target.value)} rows={3} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="musculo">
                    <AccordionTrigger>Musculoskeletal</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gait">Gait</Label>
                          <Input id="gait" value={assessmentForm.gait} onChange={(e) => handleAssessmentChange('gait', e.target.value)} placeholder="Steady, unsteady, assistive device" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rangeOfMotion">Range of Motion</Label>
                          <Input id="rangeOfMotion" value={assessmentForm.rangeOfMotion} onChange={(e) => handleAssessmentChange('rangeOfMotion', e.target.value)} placeholder="Full, limited" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="muscleStrength">Muscle Strength</Label>
                          <Input id="muscleStrength" value={assessmentForm.muscleStrength} onChange={(e) => handleAssessmentChange('muscleStrength', e.target.value)} placeholder="5/5, symmetrical" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="jointSwelling" checked={assessmentForm.jointSwelling} onCheckedChange={(checked: boolean) => handleAssessmentChange('jointSwelling', checked)} />
                          <Label htmlFor="jointSwelling">Joint swelling present</Label>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="musculoskeletalNotes">Additional Notes</Label>
                        <Textarea id="musculoskeletalNotes" value={assessmentForm.musculoskeletalNotes} onChange={(e) => handleAssessmentChange('musculoskeletalNotes', e.target.value)} rows={3} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="neuro">
                    <AccordionTrigger>Neurological</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="consciousness">Level of Consciousness</Label>
                          <Input id="consciousness" value={assessmentForm.consciousness} onChange={(e) => handleAssessmentChange('consciousness', e.target.value)} placeholder="Alert, drowsy, confused" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="orientation">Orientation</Label>
                          <Input id="orientation" value={assessmentForm.orientation} onChange={(e) => handleAssessmentChange('orientation', e.target.value)} placeholder="Person, place, time, situation" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="speech">Speech</Label>
                          <Input id="speech" value={assessmentForm.speech} onChange={(e) => handleAssessmentChange('speech', e.target.value)} placeholder="Clear, slurred, aphasia" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pupils">Pupils</Label>
                          <Input id="pupils" value={assessmentForm.pupils} onChange={(e) => handleAssessmentChange('pupils', e.target.value)} placeholder="PERRLA, size, reactivity" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="motorFunction">Motor Function</Label>
                          <Input id="motorFunction" value={assessmentForm.motorFunction} onChange={(e) => handleAssessmentChange('motorFunction', e.target.value)} placeholder="5/5, symmetrical" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sensoryFunction">Sensory Function</Label>
                          <Input id="sensoryFunction" value={assessmentForm.sensoryFunction} onChange={(e) => handleAssessmentChange('sensoryFunction', e.target.value)} placeholder="Intact, decreased" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reflexes">Reflexes</Label>
                          <Input id="reflexes" value={assessmentForm.reflexes} onChange={(e) => handleAssessmentChange('reflexes', e.target.value)} placeholder="2+, symmetrical" />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="neurologicalNotes">Additional Notes</Label>
                        <Textarea id="neurologicalNotes" value={assessmentForm.neurologicalNotes} onChange={(e) => handleAssessmentChange('neurologicalNotes', e.target.value)} rows={3} />
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button onClick={handleSaveAssessment} disabled={loading}>
                          Save Physical Assessment
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="p-4 border-t">
            <Button type="submit" onClick={handleSubmit} disabled={loading}>
              Save Changes
            </Button>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};


const PhysicalAssessmentViewDialog = ({
  open,
  onOpenChange,
  assessment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: PhysicalAssessment;
}) => {
  const renderAssessmentSection = (title: string, data: any) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <dt className="font-medium capitalize text-muted-foreground">
                {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
              </dt>
              <dd className="break-words">
                {typeof value === 'boolean'
                  ? value ? 'Yes' : 'No'
                  : (value as ReactNode) || 'N/A'} 
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Physical Assessment from {format(new Date(assessment.assessment_date), "PPP - h:mm a")}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] p-6 pt-0">
          <div className="py-4">
            {renderAssessmentSection("Skin Assessment", assessment.skin_assessment)}
            {renderAssessmentSection("EENT Assessment", assessment.eent_assessment)}
            {renderAssessmentSection("Cardiovascular Assessment", assessment.cardiovascular_assessment)}
            {renderAssessmentSection("Respiratory Assessment", assessment.respiratory_assessment)}
            {renderAssessmentSection("Gastrointestinal Assessment", assessment.gastrointestinal_assessment)}
            {renderAssessmentSection("Genitourinary Assessment", assessment.genitourinary_assessment)}
            {renderAssessmentSection("Musculoskeletal Assessment", assessment.musculoskeletal_assessment)}
            {renderAssessmentSection("Neurological Assessment", assessment.neurological_assessment)}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// -----------------------------------------------------------------------------
// Main PatientRecord Component
// -----------------------------------------------------------------------------

const PatientRecord = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchived, setIsArchived] = useState(false);

  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [imaging, setImaging] = useState<Imaging[]>([]);
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [attendingDoctorName, setAttendingDoctorName] = useState<string | null>(null);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewingAssessment, setViewingAssessment] = useState<PhysicalAssessment | null>(null);

  const fetchDoctors = useCallback(async () => {
    try {
        const { data, error } = await supabase
            .from('doctors')
            .select('id, name');
        
        if (error) throw error;
        setDoctors(data as Doctor[]);
        return data as Doctor[];
    } catch (err) {
        console.error("Error fetching doctors:", err);
        return [];
    }
  }, []);

  const fetchData = useCallback(async (patientId: string, doctorList: Doctor[]) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Patient Details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (patientError) throw patientError;

      if (!patientData) {
        setError("Patient record not found.");
        setLoading(false);
        return;
      }
      
      // The casting below is now safe because the underlying interfaces
      // have been updated to include the necessary index signature for Json.
      setPatient(patientData as unknown as Patient);
      setIsArchived(patientData.status === 'archived');
      
      // Look up attending doctor name
      if (patientData.attending_physician_id) {
          const doctor = doctorList.find(d => d.id === patientData.attending_physician_id);
          setAttendingDoctorName(doctor?.name || null);
      } else {
          setAttendingDoctorName(null);
      }


      // 2. Fetch Related Data (in parallel for efficiency)
      const [vitalsResult, assessmentsResult, labsResult, imagingResult] = await Promise.all([
        supabase.from('patient_vital_signs').select('*').eq('patient_id', patientId).order('recorded_at', { ascending: false }),
        supabase.from('physical_assessments').select('*').eq('patient_id', patientId).order('assessment_date', { ascending: false }),
        supabase.from('patient_labs').select('*').eq('patient_id', patientId).order('test_date', { ascending: false }),
        supabase.from('patient_imaging').select('*').eq('patient_id', patientId).order('imaging_date', { ascending: false }),
      ]);

      if (vitalsResult.error) console.error("Error fetching vitals:", vitalsResult.error);
      if (assessmentsResult.error) console.error("Error fetching assessments:", assessmentsResult.error);
      if (labsResult.error) console.error("Error fetching labs:", labsResult.error);
      if (imagingResult.error) console.error("Error fetching imaging:", imagingResult.error);

      setVitalSigns(vitalsResult.data as VitalSign[] || []);
      setAssessments(assessmentsResult.data as PhysicalAssessment[] || []);
      setLabs(labsResult.data as Lab[] || []);
      setImaging(imagingResult.data as Imaging[] || []);

    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || 'An unexpected error occurred while fetching the patient record.');
    } finally {
      setLoading(false);
    }
  }, []);

  // UPDATED: Main useEffect to handle sequential fetching
  useEffect(() => {
    if (id) {
        const loadAllData = async () => {
            setLoading(true);
            const fetchedDoctors = await fetchDoctors();
            await fetchData(id, fetchedDoctors);
        };
        loadAllData();
    }
  }, [id, fetchDoctors, fetchData]);

  const handlePatientSave = async (updatedData: EditPatientForm) => {
    if (!id) return;
    try {
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          name: updatedData.name,
          age: updatedData.age,
          sex: updatedData.sex,
          date_of_birth: updatedData.date_of_birth,
          hospital_number: updatedData.hospital_number,
          address: updatedData.address,
          contact_number: updatedData.contact_number,
          philhealth: updatedData.philhealth,
          admit_to_department: updatedData.admit_to_department,
          admit_to_location: updatedData.admit_to_location,
          admitting_diagnosis: updatedData.admitting_diagnosis,
          attending_physician_id: updatedData.attending_physician_id,
          allergies: updatedData.allergies,
          current_medications: updatedData.current_medications,
          problem_list: updatedData.problem_list,
          // These assignments are now correct because the interfaces include [key: string]: any;
          past_medical_history: updatedData.past_medical_history,
          personal_social_history: updatedData.personal_social_history,
          family_history: updatedData.family_history,
          history_of_present_illness: updatedData.history_of_present_illness,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      toast.success('Patient details updated successfully!');
      await fetchData(id, doctors);
    } catch (error: any) {
      toast.error('Failed to save patient details: ' + error.message);
    }
  };

  const handleArchiveToggle = async () => {
    if (!patient) return;
    const newStatus: PatientStatus = isArchived ? 'active' : 'archived'; 
    try {
      const { error } = await supabase
        .from('patients')
        .update({ status: newStatus })
        .eq('id', patient.id);

      if (error) throw error;
      
      setIsArchived(newStatus === 'archived');
      toast.success(`Patient record ${newStatus === 'archived' ? 'archived' : 'restored'} successfully.`);
    } catch (error: any) {
      toast.error(`Failed to ${newStatus === 'archived' ? 'archive' : 'restore'} record: ` + error.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // TYPE-SAFE GENERIC DELETE HANDLER FOR INDIVIDUAL RECORDS
  const handleDeleteRecord = useCallback(async (table: DeletableRecordTable, idToDelete: string, recordName: string) => {
    if (!id) return;
    try {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', idToDelete);

        if (error) throw error;

        toast.success(`${recordName} deleted successfully.`);
        await fetchData(id, doctors); // Re-fetch all data to update the UI
    } catch (error: any) {
        toast.error(`Failed to delete ${recordName}: ` + error.message);
    }
  }, [id, fetchData, doctors]);

  if (loading && !patient) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading patient record...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-8">
        <Button onClick={() => navigate('/dashboard/patients')} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Patient record is inaccessible or does not exist."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function to render a detail row
  const DetailRow = ({ label, value }: { label: string; value: string | number | undefined | null | boolean | ReactNode }) => (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-base font-semibold">
        {value === true ? 'Yes' : value === false ? 'No' : value || 'N/A'}
      </span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header and Actions */}
      <div className="flex justify-between items-center no-print">
        <Button onClick={() => navigate('/dashboard/patients')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
        </Button>
        <div className="flex space-x-2">
            
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Record
          </Button>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowEditDialog(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Record
              </Button>
            </DialogTrigger>
            {showEditDialog && (
              <EditPatientDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                patient={patient}
                doctors={doctors}
                onSave={handlePatientSave}
                vitalSigns={vitalSigns}
                onVitalSignsSave={() => fetchData(id!, doctors)}
                onAssessmentSave={() => fetchData(id!, doctors)} 
              />
            )}
          </Dialog>

          <Button variant="outline" onClick={handleArchiveToggle} className={isArchived ? "text-green-600 border-green-600 hover:bg-green-50" : "text-amber-600 border-amber-600 hover:bg-amber-50"}>
            {isArchived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
            {isArchived ? 'Restore Record' : 'Archive Record'}
          </Button>

          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Patient Header Card */}
      <Card className="p-6 shadow-lg no-print">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-3xl font-bold">{patient.name}</h1>
              <Badge 
                variant={patient.status === 'archived' ? 'destructive' : 'default'}
                className="text-base"
              >
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">Hospital No: {patient.hospital_number} {" | Patient No: "} {patient.patient_number || "N/A"}</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-base">{patient.age} y/o {patient.sex}</Badge>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DetailRow label="Attending Doctor" value={<div className="flex items-center space-x-1"><Stethoscope className="h-4 w-4 text-primary" /><span>{attendingDoctorName}</span></div>} />
          <DetailRow label="Date of Birth" value={format(new Date(patient.date_of_birth), 'PPP')} />
          <DetailRow label="Admitting Dept" value={patient.admit_to_department} />
          <DetailRow label="Room/Location" value={patient.admit_to_location} />
          <DetailRow label="PhilHealth Member" value={patient.philhealth} />
          <DetailRow label="Admitting Diagnosis" value={patient.admitting_diagnosis} />
          <DetailRow label="Contact" value={patient.contact_number} />
          <DetailRow label="Address" value={patient.address} />
        </div>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" className="no-print">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Notes</TabsTrigger>
          <TabsTrigger value="mar">MAR</TabsTrigger>
          <TabsTrigger value="io">I&O</TabsTrigger>
          <TabsTrigger value="iv">IV Fluids</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="labs">Labs</TabsTrigger>
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB CONTENT */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>History of Present Illness (HPI)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {patient.history_of_present_illness || "N/A"}
              </p>
            </CardContent>
          </Card>
          
          {/* Medical History Display */}
          <h2 className="text-xl font-bold text-gray-800">Medical Histories</h2>
          <div className="space-y-4">
              <HistorySectionDisplay title="Past Medical History" history={patient.past_medical_history} />
              <HistorySectionDisplay title="Personal & Social History" history={patient.personal_social_history} />
              <HistorySectionDisplay title="Family History" history={patient.family_history} />
          </div>
          <Separator className="my-4" />

          {/* Problem List, Allergies, Medications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle>Problem List</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(patient.problem_list || []).map((p, i) => <Badge key={i} variant="default">{p}</Badge>)}
                  {(!patient.problem_list || patient.problem_list.length === 0) && <p className="text-muted-foreground text-sm">None documented</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Allergies</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(patient.allergies || []).map((a, i) => <Badge key={i} variant="destructive">{a}</Badge>)}
                  {(!patient.allergies || patient.allergies.length === 0) && <p className="text-muted-foreground text-sm">No Known Allergies (NKA)</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Current Medications</CardTitle></CardHeader>
              <CardContent>
                {(!patient.current_medications || patient.current_medications.length === 0) ? (
                  <p className="text-muted-foreground text-sm">None documented</p>
                ) : (
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    {(patient.current_medications || []).map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CLINICAL NOTES (FDAR) TAB */}
        <TabsContent value="clinical">
          <FDARNotes patientId={patient.id} onUpdate={() => fetchData(id!, doctors)} />
        </TabsContent>

        {/* MAR TAB */}
        <TabsContent value="mar">
          <MedicationAdministration 
            patientId={patient.id} 
            patientName={patient.name}
            patientDOB={patient.date_of_birth}
            roomNo={patient.admit_to_location}
            onUpdate={() => fetchData(id!, doctors)}
          />
        </TabsContent>

        {/* I&O TAB */}
        <TabsContent value="io">
          <IntakeOutputRecord patientId={patient.id} onUpdate={() => fetchData(id!, doctors)} />
        </TabsContent>

        {/* IV FLUIDS TAB */}
        <TabsContent value="iv">
          <IVFluidMonitoring 
            patientId={patient.id}
            patientName={patient.name}
            roomNo={patient.admit_to_location}
            onUpdate={() => fetchData(id!, doctors)}
          />
        </TabsContent>
        
        {/* ASSESSMENTS TAB CONTENT */}
        <TabsContent value="assessments" className="space-y-4">
          {assessments.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-gray-50">
              <p className="text-muted-foreground">No physical assessments have been recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment, index) => (
                <Card key={assessment.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Assessment #{assessments.length - index} 
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Recorded: {format(new Date(assessment.assessment_date), "PPP - h:mm a")}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setViewingAssessment(assessment)} 
                      >
                        <UserPlus className="mr-2 h-4 w-4" /> View Details
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Are you sure you want to delete this **Physical Assessment**? This action cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                      onClick={() => handleDeleteRecord('physical_assessments', assessment.id, `Assessment #${assessments.length - index}`)}
                                      className="bg-destructive hover:bg-destructive/90"
                                  >
                                      Delete Record
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* VITALS TAB CONTENT */}
        <TabsContent value="vitals" className="space-y-4">
          {vitalSigns.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-gray-50">
              <p className="text-muted-foreground">No vital signs have been recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vitalSigns.map((vitals, index) => (
                <Card key={vitals.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Vital Signs 
                        {vitals.version && `Version ${vitals.version}`}
                        {index === 0 && <Badge className="ml-2 bg-green-500 hover:bg-green-600">LATEST</Badge>}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Recorded: {format(new Date(vitals.recorded_at), "PPP - h:mm a")}
                      </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this **Vital Sign** entry ({format(new Date(vitals.recorded_at), "h:mm a")})? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => handleDeleteRecord('patient_vital_signs', vitals.id, `Vital Signs at ${format(new Date(vitals.recorded_at), "h:mm a")}`)}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    Delete Record
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                    <DetailRow label="BP" value={vitals.blood_pressure || 'N/A'} />
                    <DetailRow label="HR (bpm)" value={vitals.heart_rate || 'N/A'} />
                    <DetailRow label="RR (rpm)" value={vitals.respiratory_rate || 'N/A'} />
                    <DetailRow label="Temp (°C)" value={vitals.temperature || 'N/A'} />
                    <DetailRow label="O₂ Sat (%)" value={vitals.oxygen_saturation || 'N/A'} />
                    <DetailRow label="Pain (0-10)" value={vitals.pain_scale || 'N/A'} />
                    {vitals.notes && <DetailRow label="Notes" value={vitals.notes} />}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* LABS TAB CONTENT */}
        <TabsContent value="labs" className="space-y-4">
          {labs.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-gray-50">
              <p className="text-muted-foreground">No lab results have been recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {labs.map((lab) => (
                <Card key={lab.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{lab.test_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Date: {format(new Date(lab.test_date), "PPP")}
                      </p>
                    </div>
                    <div className="flex space-x-2 items-center">
                        <Badge variant="secondary" className="text-lg font-bold">
                          {lab.result_value} {lab.unit}
                          {lab.flag && (
                            <span 
                              className={`ml-2 text-xs font-normal ${lab.flag.toLowerCase() === 'high' ? 'text-red-500' : lab.flag.toLowerCase() === 'low' ? 'text-blue-500' : ''}`}
                            >
                              ({lab.flag})
                            </span>
                          )}
                        </Badge>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete the lab result for **{lab.test_name}** ({format(new Date(lab.test_date), "PPP")})? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => handleDeleteRecord('patient_labs', lab.id, `Lab Result: ${lab.test_name}`)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete Record
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Ref Range:</span> {lab.normal_range || 'N/A'}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Notes/Details:</span> {lab.notes || 'None'}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* IMAGING TAB CONTENT */}
        <TabsContent value="imaging" className="space-y-4">
          {imaging.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-gray-50">
              <p className="text-muted-foreground">No imaging results have been recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {imaging.map((img) => (
                <Card key={img.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold">{img.imaging_type}</h3>
                        {img.category && <Badge variant="outline">{img.category}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Date: {format(new Date(img.imaging_date), "PPP")}
                      </p>
                    </div>
                    <div className="flex space-x-2 items-center">
                        {img.image_url && (
                            <Button variant="link" size="sm" asChild>
                                <a href={img.image_url} target="_blank" rel="noopener noreferrer">View Image</a>
                            </Button>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete the imaging study for **{img.imaging_type}** ({format(new Date(img.imaging_date), "PPP")})? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => handleDeleteRecord('patient_imaging', img.id, `Imaging Study: ${img.imaging_type}`)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete Record
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Findings:</span> {img.findings}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Recommendation/Notes:</span> {img.notes || img.recommendation || 'None'}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="no-print"> 
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patient record
              and all associated data including assessments, medications, and lab results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from("patients")
                    .delete()
                    .eq("id", id);
                  if (error) throw error;
                  toast.success("Patient deleted successfully");
                  navigate("/dashboard/patients");
                } catch (error: any) {
                  toast.error("Error deleting patient: " + error.message);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* The Assessment View Dialog */}
      {viewingAssessment && (
        <PhysicalAssessmentViewDialog
          assessment={viewingAssessment}
          open={!!viewingAssessment}
          onOpenChange={(open) => {
            if (!open) setViewingAssessment(null);
          }}
        />
      )}

      {/* RENDER PRINTABLE RECORD (HIDDEN BY DEFAULT) */}
      {patient && (
        <PrintableRecord
          patient={patient}
          vitalSigns={vitalSigns}
          assessments={assessments}
          labs={labs}
          imaging={imaging}
          attendingDoctorName={attendingDoctorName}
        />
      )}
    </div>
  );
};

export default PatientRecord;