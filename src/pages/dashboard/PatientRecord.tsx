import { useEffect, useState } from "react";
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
import { CalendarIcon, ArrowLeft, UserPlus, ArchiveRestore, Archive, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Minimal local type defs used in this file
interface Patient {
  id: string;
  hospital_number: string;
  name: string;
  age: number;
  sex: string;
  date_of_birth: string;
  status: string;
  admit_to_department?: string;
  admit_to_location?: string;
  admitting_diagnosis?: string;
  contact_number?: string;
  address?: string;
  philhealth?: boolean;
  attending_physician_id?: string;
  allergies?: string[];
  current_medications?: any[];
  problem_list?: string[];
  past_medical_history?: any;
  personal_social_history?: any;
  family_history?: any;
  history_of_present_illness?: string;
}

interface AssessmentFormState {
  // Skin Assessment
  skinColor: string;
  skinTexture: string;
  skinTurgor: string;
  skinLesions: string;
  skinEdema: boolean;
  skinNotes: string;

  // EENT Assessment
  eyes: string;
  ears: string;
  nose: string;
  throat: string;
  eentNotes: string;

  // Cardiovascular Assessment
  heartRate: string;
  heartRhythm: string;
  heartSounds: string;
  peripheralPulses: string;
  capillaryRefill: string;
  cardiovascularNotes: string;

  // Respiratory Assessment
  respiratoryRate: string;
  breathSounds: string;
  chestExpansion: string;
  cough: string;
  sputum: string;
  respiratoryNotes: string;

  // Gastrointestinal Assessment
  abdomen: string;
  bowelSounds: string;
  lastBowelMovement: string;
  appetite: string;
  giNotes: string;

  // Genitourinary Assessment
  bladderPalpation: string;
  urinaryOutput: string;
  urinaryColor: string;
  guNotes: string;

  // Musculoskeletal Assessment
  gait: string;
  rangeOfMotion: string;
  muscleStrength: string;
  jointSwelling: boolean;
  musculoskeletalNotes: string;

  // Neurological Assessment
  consciousness: string;
  orientation: string;
  speech: string;
  pupils: string;
  motorFunction: string;
  sensoryFunction: string;
  reflexes: string;
  neurologicalNotes: string;
}

interface PhysicalAssessment {
  id: string;
  assessment_date: string;
  skin_assessment: {
    color: string;
    texture: string;
    turgor: string;
    lesions: string;
    edema: boolean;
    notes: string;
  };
  eent_assessment: {
    eyes: string;
    ears: string;
    nose: string;
    throat: string;
    notes: string;
  };
  cardiovascular_assessment: {
    heart_rate: string;
    rhythm: string;
    heart_sounds: string;
    peripheral_pulses: string;
    capillary_refill: string;
    notes: string;
  };
  respiratory_assessment: {
    respiratory_rate: string;
    breath_sounds: string;
    chest_expansion: string;
    cough: string;
    sputum: string;
    notes: string;
  };
  gastrointestinal_assessment: {
    abdomen: string;
    bowel_sounds: string;
    last_bowel_movement: string;
    appetite: string;
    notes: string;
  };
  genitourinary_assessment: {
    bladder_palpation: string;
    urinary_output: string;
    urinary_color: string;
    notes: string;
  };
  musculoskeletal_assessment: {
    gait: string;
    range_of_motion: string;
    muscle_strength: string;
    joint_swelling: boolean;
    notes: string;
  };
  neurological_assessment: {
    consciousness: string;
    orientation: string;
    speech: string;
    pupils: string;
    motor_function: string;
    sensory_function: string;
    reflexes: string;
    notes: string;
  };
}

interface Lab {
  id: string;
  patient_id: string;
  test_date: string;
  test_name: string;
  test_result: string;
  reference_range?: string;
  remarks?: string;
  created_at: string;
}

interface Imaging {
  id: string;
  patient_id: string;
  imaging_date: string;
  imaging_type: string;
  findings: string;
  recommendation?: string;
  image_url?: string;
  created_at: string;
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
  admit_to_department?: string;
  admit_to_location?: string;
  admitting_diagnosis?: string;
  allergies: string[];
  current_medications: string[];
  problem_list: string[];
  past_medical_history: any;
  personal_social_history: any;
  family_history: any;
  history_of_present_illness?: string;
  vital_signs?: any;
}

const EditPatientDialog = ({ 
  open, 
  onOpenChange, 
  patient,
  onSave,
  vitalSigns,
  onVitalSignsSave 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onSave: (data: EditPatientForm) => Promise<void>;
  vitalSigns: any[];
  onVitalSignsSave: () => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState<AssessmentFormState>({
    // Skin Assessment
    skinColor: '',
    skinTexture: '',
    skinTurgor: '',
    skinLesions: '',
    skinEdema: false,
    skinNotes: '',

    // EENT Assessment
    eyes: '',
    ears: '',
    nose: '',
    throat: '',
    eentNotes: '',

    // Cardiovascular Assessment
    heartRate: '',
    heartRhythm: '',
    heartSounds: '',
    peripheralPulses: '',
    capillaryRefill: '',
    cardiovascularNotes: '',

    // Respiratory Assessment
    respiratoryRate: '',
    breathSounds: '',
    chestExpansion: '',
    cough: '',
    sputum: '',
    respiratoryNotes: '',

    // Gastrointestinal Assessment
    abdomen: '',
    bowelSounds: '',
    lastBowelMovement: '',
    appetite: '',
    giNotes: '',

    // Genitourinary Assessment
    bladderPalpation: '',
    urinaryOutput: '',
    urinaryColor: '',
    guNotes: '',

    // Musculoskeletal Assessment
    gait: '',
    rangeOfMotion: '',
    muscleStrength: '',
    jointSwelling: false,
    musculoskeletalNotes: '',

    // Neurological Assessment
    consciousness: '',
    orientation: '',
    speech: '',
    pupils: '',
    motorFunction: '',
    sensoryFunction: '',
    reflexes: '',
    neurologicalNotes: ''
  });

  const handleSaveAssessment = async () => {
    try {
      setLoading(true);
      
      const assessment: PhysicalAssessment = {
        id: crypto.randomUUID(),
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
          eyes: assessmentForm.eyes,
          ears: assessmentForm.ears,
          nose: assessmentForm.nose,
          throat: assessmentForm.throat,
          notes: assessmentForm.eentNotes
        },
        cardiovascular_assessment: {
          heart_rate: assessmentForm.heartRate,
          rhythm: assessmentForm.heartRhythm,
          heart_sounds: assessmentForm.heartSounds,
          peripheral_pulses: assessmentForm.peripheralPulses,
          capillary_refill: assessmentForm.capillaryRefill,
          notes: assessmentForm.cardiovascularNotes
        },
        respiratory_assessment: {
          respiratory_rate: assessmentForm.respiratoryRate,
          breath_sounds: assessmentForm.breathSounds,
          chest_expansion: assessmentForm.chestExpansion,
          cough: assessmentForm.cough,
          sputum: assessmentForm.sputum,
          notes: assessmentForm.respiratoryNotes
        },
        gastrointestinal_assessment: {
          abdomen: assessmentForm.abdomen,
          bowel_sounds: assessmentForm.bowelSounds,
          last_bowel_movement: assessmentForm.lastBowelMovement,
          appetite: assessmentForm.appetite,
          notes: assessmentForm.giNotes
        },
        genitourinary_assessment: {
          bladder_palpation: assessmentForm.bladderPalpation,
          urinary_output: assessmentForm.urinaryOutput,
          urinary_color: assessmentForm.urinaryColor,
          notes: assessmentForm.guNotes
        },
        musculoskeletal_assessment: {
          gait: assessmentForm.gait,
          range_of_motion: assessmentForm.rangeOfMotion,
          muscle_strength: assessmentForm.muscleStrength,
          joint_swelling: assessmentForm.jointSwelling,
          notes: assessmentForm.musculoskeletalNotes
        },
        neurological_assessment: {
          consciousness: assessmentForm.consciousness,
          orientation: assessmentForm.orientation,
          speech: assessmentForm.speech,
          pupils: assessmentForm.pupils,
          motor_function: assessmentForm.motorFunction,
          sensory_function: assessmentForm.sensoryFunction,
          reflexes: assessmentForm.reflexes,
          notes: assessmentForm.neurologicalNotes
        }
      };

      const { error } = await supabase
        .from('physical_assessments')
        .insert([{ ...assessment, patient_id: id }]);

      if (error) throw error;

      toast.success('Physical assessment saved successfully');
      
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

  const [formData, setFormData] = useState<EditPatientForm>({
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
    allergies: patient.allergies || [],
    current_medications: patient.current_medications || [],
    problem_list: patient.problem_list || [],
    past_medical_history: patient.past_medical_history || {
      hypertension: false,
      heartDisease: false,
      bronchialAsthma: false,
      diabetes: false,
      cancer: false,
      tuberculosis: false,
      hepatitis: false,
      kidneyDisease: false,
      others: ""
    },
    personal_social_history: patient.personal_social_history || {
      smoker: false,
      alcoholic: false,
      occupation: ""
    },
    family_history: patient.family_history || {
      hypertension: false,
      diabetes: false,
      heartDisease: false,
      cancer: false,
      tuberculosis: false,
      others: ""
    },
    history_of_present_illness: patient.history_of_present_illness,
    vital_signs: {}
  });

  const handleInputChange = (field: keyof EditPatientForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof EditPatientForm, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    handleInputChange(field, items);
  };

  const handleRemoveArrayItem = (field: keyof EditPatientForm, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSaveVitals = async ({ createNewVersion }: { createNewVersion: boolean }) => {
    try {
      setLoading(true);
      
      const vitalSignPayload = {
        patient_id: patient.id,
        blood_pressure: formData.vital_signs?.blood_pressure,
        heart_rate: formData.vital_signs?.heart_rate,
        respiratory_rate: formData.vital_signs?.respiratory_rate,
        temperature: formData.vital_signs?.temperature,
        oxygen_saturation: formData.vital_signs?.oxygen_saturation,
        pain_scale: formData.vital_signs?.pain_scale,
        version: createNewVersion ? (vitalSigns[0]?.version || 0) + 1 : (vitalSigns[0]?.version || 1)
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
      await onSave(formData);
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
                <TabsTrigger value="vitals">Vital Signs & Medical History</TabsTrigger>
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
                                onSelect={(date) => date && handleInputChange("date_of_birth", format(date, "yyyy-MM-dd"))} 
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
                            onChange={(e) => handleInputChange("vital_signs", { 
                              ...(formData.vital_signs || {}), 
                              blood_pressure: e.target.value 
                            })} 
                            placeholder="120/80" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                          <Input 
                            id="heart_rate" 
                            type="number" 
                            value={formData.vital_signs?.heart_rate || ""} 
                            onChange={(e) => handleInputChange("vital_signs", { 
                              ...(formData.vital_signs || {}), 
                              heart_rate: parseInt(e.target.value) 
                            })} 
                            placeholder="80" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="respiratory_rate">Respiratory Rate (rpm)</Label>
                          <Input 
                            id="respiratory_rate" 
                            type="number" 
                            value={formData.vital_signs?.respiratory_rate || ""} 
                            onChange={(e) => handleInputChange("vital_signs", { 
                              ...(formData.vital_signs || {}), 
                              respiratory_rate: parseInt(e.target.value) 
                            })} 
                            placeholder="16" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="oxygen_saturation">O₂ Saturation (%)</Label>
                          <Input 
                            id="oxygen_saturation" 
                            type="number" 
                            value={formData.vital_signs?.oxygen_saturation || ""} 
                            onChange={(e) => handleInputChange("vital_signs", { 
                              ...(formData.vital_signs || {}), 
                              oxygen_saturation: parseInt(e.target.value) 
                            })} 
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
                            onChange={(e) => handleInputChange("vital_signs", { 
                              ...(formData.vital_signs || {}), 
                              temperature: parseFloat(e.target.value) 
                            })} 
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
                            onChange={(e) => handleInputChange("vital_signs", { 
                              ...(formData.vital_signs || {}), 
                              pain_scale: parseInt(e.target.value) 
                            })} 
                            placeholder="0" 
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => handleSaveVitals({ createNewVersion: true })} 
                          disabled={loading}
                        >
                          Save as New Version
                        </Button>
                        <Button 
                          onClick={() => handleSaveVitals({ createNewVersion: false })} 
                          disabled={loading}
                        >
                          Update Current
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
                              key === 'others' ? null : (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={key} 
                                    checked={value as boolean} 
                                    onCheckedChange={(checked) => handleInputChange(
                                      "past_medical_history", 
                                      { ...(formData.past_medical_history || {}), [key]: checked }
                                    )} 
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
                            onChange={(e) => handleInputChange(
                              "past_medical_history", 
                              { ...(formData.past_medical_history || {}), others: e.target.value }
                            )} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Personal & Social History</Label>
                          <div className="flex gap-6">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="smoker" 
                                checked={formData.personal_social_history?.smoker} 
                                onCheckedChange={(checked) => handleInputChange(
                                  "personal_social_history", 
                                  { ...(formData.personal_social_history || {}), smoker: checked }
                                )} 
                              />
                              <Label htmlFor="smoker">Smoker</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="alcoholic" 
                                checked={formData.personal_social_history?.alcoholic} 
                                onCheckedChange={(checked) => handleInputChange(
                                  "personal_social_history", 
                                  { ...(formData.personal_social_history || {}), alcoholic: checked }
                                )} 
                              />
                              <Label htmlFor="alcoholic">Drinks Alcohol</Label>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Family History</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(formData.family_history || {}).map(([key, value]) => 
                              key === 'others' ? null : (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`fh-${key}`} 
                                    checked={value as boolean} 
                                    onCheckedChange={(checked) => handleInputChange(
                                      "family_history", 
                                      { ...(formData.family_history || {}), [key]: checked }
                                    )} 
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
                            onChange={(e) => handleInputChange(
                              "family_history", 
                              { ...(formData.family_history || {}), others: e.target.value }
                            )} 
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="problems">
                    <AccordionTrigger>Problem List & Allergies</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <Label htmlFor="problemList">Problem List (comma-separated)</Label>
                        <Input 
                          id="problemList" 
                          value={(formData.problem_list || []).join(', ')} 
                          onChange={(e) => handleArrayChange('problem_list', e.target.value)} 
                          placeholder="e.g., Hypertension, Diabetes" 
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(formData.problem_list || []).map((p, i) => (
                            <Badge key={i} variant="secondary" className="flex items-center gap-2">
                              {p}
                              <button 
                                onClick={() => handleRemoveArrayItem('problem_list', i)} 
                                className="hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>

                        <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                        <Input 
                          id="allergies" 
                          value={(formData.allergies || []).join(', ')} 
                          onChange={(e) => handleArrayChange('allergies', e.target.value)} 
                          placeholder="e.g., Penicillin, Shellfish" 
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(formData.allergies || []).map((a, i) => (
                            <Badge key={i} variant="secondary" className="flex items-center gap-2">
                              {a}
                              <button 
                                onClick={() => handleRemoveArrayItem('allergies', i)} 
                                className="hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>

                        <Label htmlFor="currentMedications">Current Medications (comma-separated)</Label>
                        <Input 
                          id="currentMedications" 
                          value={(formData.current_medications || []).join(', ')} 
                          onChange={(e) => handleArrayChange('current_medications', e.target.value)} 
                          placeholder="e.g., Metformin 500mg, Lisinopril 10mg" 
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(formData.current_medications || []).map((m, i) => (
                            <Badge key={i} variant="secondary" className="flex items-center gap-2">
                              {m}
                              <button 
                                onClick={() => handleRemoveArrayItem('current_medications', i)} 
                                className="hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
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
                          <Input
                            id="skinColor"
                            value={assessmentForm.skinColor}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, skinColor: e.target.value })}
                            placeholder="e.g., Pink, Pale, Cyanotic"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skinTexture">Texture</Label>
                          <Input
                            id="skinTexture"
                            value={assessmentForm.skinTexture}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, skinTexture: e.target.value })}
                            placeholder="e.g., Smooth, Rough, Dry"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skinTurgor">Turgor</Label>
                          <Input
                            id="skinTurgor"
                            value={assessmentForm.skinTurgor}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, skinTurgor: e.target.value })}
                            placeholder="e.g., Good, Poor"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skinLesions">Lesions</Label>
                          <Input
                            id="skinLesions"
                            value={assessmentForm.skinLesions}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, skinLesions: e.target.value })}
                            placeholder="Describe any lesions"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="skinEdema"
                            checked={assessmentForm.skinEdema}
                            onCheckedChange={(checked) => setAssessmentForm({ ...assessmentForm, skinEdema: checked as boolean })}
                          />
                          <Label htmlFor="skinEdema">Edema present</Label>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="skinNotes">Additional Notes</Label>
                        <Textarea
                          id="skinNotes"
                          value={assessmentForm.skinNotes}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, skinNotes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="eent">
                    <AccordionTrigger>EENT Assessment</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="eyes">Eyes</Label>
                          <Input
                            id="eyes"
                            value={assessmentForm.eyes}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, eyes: e.target.value })}
                            placeholder="PERRLA, conjunctiva, sclera"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ears">Ears</Label>
                          <Input
                            id="ears"
                            value={assessmentForm.ears}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, ears: e.target.value })}
                            placeholder="Hearing, discharge, tympanic membrane"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nose">Nose</Label>
                          <Input
                            id="nose"
                            value={assessmentForm.nose}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, nose: e.target.value })}
                            placeholder="Discharge, septum, turbinates"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="throat">Throat</Label>
                          <Input
                            id="throat"
                            value={assessmentForm.throat}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, throat: e.target.value })}
                            placeholder="Pharynx, tonsils, uvula"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="eentNotes">Additional Notes</Label>
                        <Textarea
                          id="eentNotes"
                          value={assessmentForm.eentNotes}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, eentNotes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cardio">
                    <AccordionTrigger>Cardiovascular</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="heartRate">Heart Rate</Label>
                          <Input
                            id="heartRate"
                            value={assessmentForm.heartRate}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, heartRate: e.target.value })}
                            placeholder="e.g., 72 bpm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heartRhythm">Rhythm</Label>
                          <Input
                            id="heartRhythm"
                            value={assessmentForm.heartRhythm}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, heartRhythm: e.target.value })}
                            placeholder="Regular, Irregular"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heartSounds">Heart Sounds</Label>
                          <Input
                            id="heartSounds"
                            value={assessmentForm.heartSounds}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, heartSounds: e.target.value })}
                            placeholder="S1, S2, murmurs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="peripheralPulses">Peripheral Pulses</Label>
                          <Input
                            id="peripheralPulses"
                            value={assessmentForm.peripheralPulses}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, peripheralPulses: e.target.value })}
                            placeholder="Radial, pedal, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capillaryRefill">Capillary Refill</Label>
                          <Input
                            id="capillaryRefill"
                            value={assessmentForm.capillaryRefill}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, capillaryRefill: e.target.value })}
                            placeholder="<2 seconds, delayed"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="cardiovascularNotes">Additional Notes</Label>
                        <Textarea
                          id="cardiovascularNotes"
                          value={assessmentForm.cardiovascularNotes}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, cardiovascularNotes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="respiratory">
                    <AccordionTrigger>Respiratory</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
                          <Input
                            id="respiratoryRate"
                            value={assessmentForm.respiratoryRate}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, respiratoryRate: e.target.value })}
                            placeholder="e.g., 16/min"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="breathSounds">Breath Sounds</Label>
                          <Input
                            id="breathSounds"
                            value={assessmentForm.breathSounds}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, breathSounds: e.target.value })}
                            placeholder="Clear, crackles, wheezes"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chestExpansion">Chest Expansion</Label>
                          <Input
                            id="chestExpansion"
                            value={assessmentForm.chestExpansion}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, chestExpansion: e.target.value })}
                            placeholder="Symmetrical, asymmetrical"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cough">Cough</Label>
                          <Input
                            id="cough"
                            value={assessmentForm.cough}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, cough: e.target.value })}
                            placeholder="Productive, non-productive"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sputum">Sputum</Label>
                          <Input
                            id="sputum"
                            value={assessmentForm.sputum}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, sputum: e.target.value })}
                            placeholder="Color, consistency"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="respiratoryNotes">Additional Notes</Label>
                        <Textarea
                          id="respiratoryNotes"
                          value={assessmentForm.respiratoryNotes}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, respiratoryNotes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="gi">
                    <AccordionTrigger>Gastrointestinal</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="abdomen">Abdomen</Label>
                          <Input
                            id="abdomen"
                            value={assessmentForm.abdomen}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, abdomen: e.target.value })}
                            placeholder="Soft, distended, tender"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bowelSounds">Bowel Sounds</Label>
                          <Input
                            id="bowelSounds"
                            value={assessmentForm.bowelSounds}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, bowelSounds: e.target.value })}
                            placeholder="Active, hypoactive, hyperactive"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastBowelMovement">Last Bowel Movement</Label>
                          <Input
                            id="lastBowelMovement"
                            value={assessmentForm.lastBowelMovement}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, lastBowelMovement: e.target.value })}
                            placeholder="Date/time"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="appetite">Appetite</Label>
                          <Input
                            id="appetite"
                            value={assessmentForm.appetite}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, appetite: e.target.value })}
                            placeholder="Good, poor, nausea/vomiting"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="giNotes">Additional Notes</Label>
                        <Textarea
                          id="giNotes"
                          value={assessmentForm.giNotes}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, giNotes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="gu">
                    <AccordionTrigger>Genitourinary</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bladderPalpation">Bladder Palpation</Label>
                          <Input
                            id="bladderPalpation"
                            value={assessmentForm.bladderPalpation}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, bladderPalpation: e.target.value })}
                            placeholder="Non-distended, distended"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="urinaryOutput">Urinary Output</Label>
                          <Input
                            id="urinaryOutput"
                            value={assessmentForm.urinaryOutput}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, urinaryOutput: e.target.value })}
                            placeholder="Amount, frequency"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="urinaryColor">Urine Color</Label>
                          <Input
                            id="urinaryColor"
                            value={assessmentForm.urinaryColor}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, urinaryColor: e.target.value })}
                            placeholder="Clear, amber, cloudy"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="guNotes">Additional Notes</Label>
                        <Textarea
                          id="guNotes"
                          value={assessmentForm.guNotes}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, guNotes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="musculo">
                    <AccordionTrigger>Musculoskeletal</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gait">Gait</Label>
                          <Input
                            id="gait"
                            value={assessmentForm.gait}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, gait: e.target.value })}
                            placeholder="Steady, unsteady, assistive device"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rangeOfMotion">Range of Motion</Label>
                          <Input
                            id="rangeOfMotion"
                            value={assessmentForm.rangeOfMotion}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, rangeOfMotion: e.target.value })}
                            placeholder="Full, limited"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="muscleStrength">Muscle Strength</Label>
                          <Input
                            id="muscleStrength"
                            value={assessmentForm.muscleStrength}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, muscleStrength: e.target.value })}
                            placeholder="5/5, symmetrical"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="jointSwelling"
                            checked={assessmentForm.jointSwelling}
                            onCheckedChange={(checked) => setAssessmentForm({ ...assessmentForm, jointSwelling: checked as boolean })}
                          />
                          <Label htmlFor="jointSwelling">Joint swelling present</Label>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="musculoskeletalNotes">Additional Notes</Label>
                        <Textarea
                          id="musculoskeletalNotes"
                          value={assessmentForm.musculoskeletalNotes}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, musculoskeletalNotes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="neuro">
                    <AccordionTrigger>Neurological</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="consciousness">Level of Consciousness</Label>
                          <Input
                            id="consciousness"
                            value={assessmentForm.consciousness}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, consciousness: e.target.value })}
                            placeholder="Alert, drowsy, confused"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="orientation">Orientation</Label>
                          <Input
                            id="orientation"
                            value={assessmentForm.orientation}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, orientation: e.target.value })}
                            placeholder="Person, place, time, situation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="speech">Speech</Label>
                          <Input
                            id="speech"
                            value={assessmentForm.speech}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, speech: e.target.value })}
                            placeholder="Clear, slurred, aphasia"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pupils">Pupils</Label>
                          <Input
                            id="pupils"
                            value={assessmentForm.pupils}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, pupils: e.target.value })}
                            placeholder="PERRLA, size, reactivity"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="motorFunction">Motor Function</Label>
                          <Input
                            id="motorFunction"
                            value={assessmentForm.motorFunction}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, motorFunction: e.target.value })}
                            placeholder="Moves all extremities"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sensoryFunction">Sensory Function</Label>
                          <Input
                            id="sensoryFunction"
                            value={assessmentForm.sensoryFunction}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, sensoryFunction: e.target.value })}
                            placeholder="Intact to light touch"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reflexes">Reflexes</Label>
                          <Input
                            id="reflexes"
                            value={assessmentForm.reflexes}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, reflexes: e.target.value })}
                            placeholder="2+ bilateral"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="neurologicalNotes">Additional Notes</Label>
                        <Textarea
                          id="neurologicalNotes"
                          value={assessmentForm.neurologicalNotes}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, neurologicalNotes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    onClick={handleSaveAssessment}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Assessment"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PatientRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [physicalAssessments, setPhysicalAssessments] = useState<PhysicalAssessment[]>([]);
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [imaging, setImaging] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLabDialog, setShowLabDialog] = useState(false);
  const [showImagingDialog, setShowImagingDialog] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [editingImaging, setEditingImaging] = useState<Imaging | null>(null);
  
  // Lab form state
  const [labForm, setLabForm] = useState({
    test_name: "",
    test_date: new Date().toISOString().split('T')[0],
    test_result: "",
    reference_range: "",
    remarks: ""
  });

  // Imaging form state
  const [imagingForm, setImagingForm] = useState({
    imaging_type: "",
    imaging_date: new Date().toISOString().split('T')[0],
    findings: "",
    recommendation: "",
    image_url: ""
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [assessmentForm, setAssessmentForm] = useState({
    // Skin Assessment
    skinColor: "",
    skinTexture: "",
    skinTurgor: "",
    skinLesions: "",
    skinEdema: false,
    skinNotes: "",
    
    // EENT Assessment
    eyes: "",
    ears: "",
    nose: "",
    throat: "",
    eentNotes: "",
    
    // Cardiovascular
    heartRate: "",
    heartRhythm: "",
    heartSounds: "",
    peripheralPulses: "",
    capillaryRefill: "",
    cardiovascularNotes: "",
    
    // Respiratory
    respiratoryRate: "",
    breathSounds: "",
    chestExpansion: "",
    cough: "",
    sputum: "",
    respiratoryNotes: "",
    
    // Gastrointestinal
    abdomen: "",
    bowelSounds: "",
    lastBowelMovement: "",
    appetite: "",
    giNotes: "",
    
    // Genitourinary
    bladderPalpation: "",
    urinaryOutput: "",
    urinaryColor: "",
    guNotes: "",
    
    // Musculoskeletal
    gait: "",
    rangeOfMotion: "",
    muscleStrength: "",
    jointSwelling: false,
    musculoskeletalNotes: "",
    
    // Neurological
    consciousness: "",
    orientation: "",
    speech: "",
    pupils: "",
    motorFunction: "",
    sensoryFunction: "",
    reflexes: "",
    neurologicalNotes: "",
  });

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  // Helper to render JSON-like history fields safely
  const renderJsonData = (data: any) => {
    if (!data) return <p className="text-sm text-muted-foreground">No data</p>;

    let obj = data;
    if (typeof data === "string") {
      try {
        obj = JSON.parse(data);
      } catch (e) {
        // not JSON, render raw string
        return <p className="text-sm">{data}</p>;
      }
    }

    if (typeof obj !== "object") return <p className="text-sm">{String(obj)}</p>;

    const entries = Object.entries(obj);
    if (entries.length === 0) return <p className="text-sm text-muted-foreground">No data</p>;

    return (
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>{" "}
            <span>{typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch all related data
      const [assessments, vitals, meds, labsData, imagingData, doctorsData] = await Promise.all([
        supabase.from("physical_assessments").select("*").eq("patient_id", id).order("assessment_date", { ascending: false }),
        supabase.from("patient_vital_signs").select("*").eq("patient_id", id).order("recorded_at", { ascending: false }).limit(5),
        supabase.from("patient_medications").select("*").eq("patient_id", id).order("start_date", { ascending: false }),
        supabase.from("patient_labs").select("*").eq("patient_id", id).order("test_date", { ascending: false }).limit(5),
        supabase.from("patient_imaging").select("*").eq("patient_id", id).order("imaging_date", { ascending: false }).limit(5),
        supabase.from("doctors").select("*").order("name", { ascending: true })
      ]);

      setPhysicalAssessments(assessments.data || []);
      setVitalSigns(vitals.data || []);
      setMedications(meds.data || []);
      setLabs(labsData.data || []);
      setImaging(imagingData.data || []);
      setDoctors(doctorsData.data || []);
      
      if (patientData.attending_physician_id) {
        setSelectedDoctorId(patientData.attending_physician_id);
      }
    } catch (error: any) {
      toast.error("Error loading patient data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Lab CRUD handlers
  const handleSaveLab = async (isNew: boolean) => {
    try {
      setLoading(true);
      const labData = {
        patient_id: id,
        ...labForm
      };

      if (isNew) {
        const { error } = await supabase
          .from("patient_labs")
          .insert(labData);
        if (error) throw error;
        toast.success("Lab record added successfully");
      } else if (editingLab) {
        const { error } = await supabase
          .from("patient_labs")
          .update(labData)
          .eq("id", editingLab.id);
        if (error) throw error;
        toast.success("Lab record updated successfully");
      }

      setShowLabDialog(false);
      setEditingLab(null);
      setLabForm({
        test_name: "",
        test_date: new Date().toISOString().split('T')[0],
        test_result: "",
        reference_range: "",
        remarks: ""
      });
      await fetchPatientData();
    } catch (error: any) {
      toast.error("Error saving lab record: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLab = async (labId: string) => {
    try {
      const { error } = await supabase
        .from("patient_labs")
        .delete()
        .eq("id", labId);
      if (error) throw error;
      toast.success("Lab record deleted successfully");
      await fetchPatientData();
    } catch (error: any) {
      toast.error("Error deleting lab record: " + error.message);
    }
  };

  // Imaging CRUD handlers
  const handleSaveImaging = async (isNew: boolean) => {
    try {
      setLoading(true);
      const imagingData = {
        patient_id: id,
        ...imagingForm
      };

      if (isNew) {
        const { error } = await supabase
          .from("patient_imaging")
          .insert(imagingData);
        if (error) throw error;
        toast.success("Imaging record added successfully");
      } else if (editingImaging) {
        const { error } = await supabase
          .from("patient_imaging")
          .update(imagingData)
          .eq("id", editingImaging.id);
        if (error) throw error;
        toast.success("Imaging record updated successfully");
      }

      setShowImagingDialog(false);
      setEditingImaging(null);
      setImagingForm({
        imaging_type: "",
        imaging_date: new Date().toISOString().split('T')[0],
        findings: "",
        recommendation: "",
        image_url: ""
      });
      await fetchPatientData();
    } catch (error: any) {
      toast.error("Error saving imaging record: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImaging = async (imagingId: string) => {
    try {
      const { error } = await supabase
        .from("patient_imaging")
        .delete()
        .eq("id", imagingId);
      if (error) throw error;
      toast.success("Imaging record deleted successfully");
      await fetchPatientData();
    } catch (error: any) {
      toast.error("Error deleting imaging record: " + error.message);
    }
  };

  // Physical Assessment CRUD
  const handleDeleteAssessment = async (assessmentId: string) => {
    try {
      const { error } = await supabase
        .from("physical_assessments")
        .delete()
        .eq("id", assessmentId);
      if (error) throw error;
      toast.success("Assessment record deleted successfully");
      await fetchPatientData();
    } catch (error: any) {
      toast.error("Error deleting assessment: " + error.message);
    }
  };

  const handleSavePatient = async (data: any) => {
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          name: data.name,
          age: data.age,
          sex: data.sex,
          date_of_birth: data.date_of_birth,
          address: data.address,
          contact_number: data.contact_number,
          hospital_number: data.hospital_number,
          philhealth: data.philhealth,
          admit_to_department: data.admit_to_department as any,
          admit_to_location: data.admit_to_location,
          admitting_diagnosis: data.admitting_diagnosis,
          allergies: data.allergies,
          current_medications: data.current_medications,
          problem_list: data.problem_list,
          past_medical_history: data.past_medical_history,
          personal_social_history: data.personal_social_history,
          history_of_present_illness: data.history_of_present_illness,
        })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Patient record updated successfully");
      await fetchPatientData();
    } catch (error: any) {
      toast.error("Error updating patient: " + error.message);
      throw error;
    }
  };

  const handleSaveAssessment = async () => {
    try {
      const assessmentPayload = {
        patient_id: id,
        skin_assessment: {
          color: assessmentForm.skinColor,
          texture: assessmentForm.skinTexture,
          turgor: assessmentForm.skinTurgor,
          lesions: assessmentForm.skinLesions,
          edema: assessmentForm.skinEdema,
          notes: assessmentForm.skinNotes,
        },
        eent_assessment: {
          eyes: assessmentForm.eyes,
          ears: assessmentForm.ears,
          nose: assessmentForm.nose,
          throat: assessmentForm.throat,
          notes: assessmentForm.eentNotes,
        },
        cardiovascular_assessment: {
          heart_rate: assessmentForm.heartRate,
          heart_rhythm: assessmentForm.heartRhythm,
          heart_sounds: assessmentForm.heartSounds,
          peripheral_pulses: assessmentForm.peripheralPulses,
          capillary_refill: assessmentForm.capillaryRefill,
          notes: assessmentForm.cardiovascularNotes,
        },
        respiratory_assessment: {
          respiratory_rate: assessmentForm.respiratoryRate,
          breath_sounds: assessmentForm.breathSounds,
          chest_expansion: assessmentForm.chestExpansion,
          cough: assessmentForm.cough,
          sputum: assessmentForm.sputum,
          notes: assessmentForm.respiratoryNotes,
        },
        gastrointestinal_assessment: {
          abdomen: assessmentForm.abdomen,
          bowel_sounds: assessmentForm.bowelSounds,
          last_bowel_movement: assessmentForm.lastBowelMovement,
          appetite: assessmentForm.appetite,
          notes: assessmentForm.giNotes,
        },
        genitourinary_assessment: {
          bladder_palpation: assessmentForm.bladderPalpation,
          urinary_output: assessmentForm.urinaryOutput,
          urinary_color: assessmentForm.urinaryColor,
          notes: assessmentForm.guNotes,
        },
        musculoskeletal_assessment: {
          gait: assessmentForm.gait,
          range_of_motion: assessmentForm.rangeOfMotion,
          muscle_strength: assessmentForm.muscleStrength,
          joint_swelling: assessmentForm.jointSwelling,
          notes: assessmentForm.musculoskeletalNotes,
        },
        neurological_assessment: {
          consciousness: assessmentForm.consciousness,
          orientation: assessmentForm.orientation,
          speech: assessmentForm.speech,
          pupils: assessmentForm.pupils,
          motor_function: assessmentForm.motorFunction,
          sensory_function: assessmentForm.sensoryFunction,
          reflexes: assessmentForm.reflexes,
          notes: assessmentForm.neurologicalNotes,
        },
      };

      const { error } = await supabase.from("physical_assessments").insert(assessmentPayload);

      if (error) throw error;

      toast.success("Physical assessment saved successfully");
      setShowAssessmentDialog(false);
      fetchPatientData();
    } catch (error: any) {
      toast.error("Error saving assessment: " + error.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!patient) {
    return <div className="flex justify-center items-center min-h-screen">Patient not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/dashboard/patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{patient.name}</h1>
            <p className="text-muted-foreground">Hospital No: {patient.hospital_number}</p>
            <p className="text-muted-foreground">Assigned Doctor: {doctors.find(d => d.id === patient.attending_physician_id)?.name || "Not assigned"}</p>
            <Badge variant={patient.status === "active" ? "default" : "secondary"} className="mt-2">
              {patient.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Doctor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Attending Physician</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Doctor</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from("patients")
                        .update({ attending_physician_id: selectedDoctorId })
                        .eq("id", id);
                      if (error) throw error;
                      toast.success("Doctor assigned successfully");
                      setShowAssignDialog(false);
                      fetchPatientData();
                    } catch (error: any) {
                      toast.error("Error assigning doctor: " + error.message);
                    }
                  }}
                  className="w-full"
                >
                  Assign Doctor
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {patient.status === "archived" && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from("patients")
                    .update({ status: "active" })
                    .eq("id", id);
                  if (error) throw error;
                  toast.success("Patient unarchived");
                  fetchPatientData();
                } catch (error: any) {
                  toast.error("Error: " + error.message);
                }
              }}
            >
              <ArchiveRestore className="h-4 w-4 mr-2" />
              Unarchive
            </Button>
          )}

          {patient.status === "active" && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from("patients")
                    .update({ status: "archived" })
                    .eq("id", id);
                  if (error) throw error;
                  toast.success("Patient archived");
                  fetchPatientData();
                } catch (error: any) {
                  toast.error("Error: " + error.message);
                }
              }}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}

          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Patient
          </Button>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>

          <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Physical Assessment
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Physical Assessment</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="skin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="skin">Skin</TabsTrigger>
                <TabsTrigger value="eent">EENT</TabsTrigger>
                <TabsTrigger value="cardio">Cardio</TabsTrigger>
                <TabsTrigger value="respiratory">Respiratory</TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="gi">GI</TabsTrigger>
                <TabsTrigger value="gu">GU</TabsTrigger>
                <TabsTrigger value="musculo">Musculoskeletal</TabsTrigger>
                <TabsTrigger value="neuro">Neurological</TabsTrigger>
              </TabsList>

              <TabsContent value="skin" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      value={assessmentForm.skinColor}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, skinColor: e.target.value })}
                      placeholder="e.g., Pink, Pale, Cyanotic"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Texture</Label>
                    <Input
                      value={assessmentForm.skinTexture}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, skinTexture: e.target.value })}
                      placeholder="e.g., Smooth, Rough, Dry"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Turgor</Label>
                    <Input
                      value={assessmentForm.skinTurgor}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, skinTurgor: e.target.value })}
                      placeholder="e.g., Good, Poor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lesions</Label>
                    <Input
                      value={assessmentForm.skinLesions}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, skinLesions: e.target.value })}
                      placeholder="Describe any lesions"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={assessmentForm.skinEdema}
                      onCheckedChange={(checked) => setAssessmentForm({ ...assessmentForm, skinEdema: checked as boolean })}
                    />
                    <Label>Edema present</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={assessmentForm.skinNotes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, skinNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="eent" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Eyes</Label>
                    <Input
                      value={assessmentForm.eyes}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, eyes: e.target.value })}
                      placeholder="PERRLA, conjunctiva, sclera"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ears</Label>
                    <Input
                      value={assessmentForm.ears}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, ears: e.target.value })}
                      placeholder="Hearing, discharge, tympanic membrane"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nose</Label>
                    <Input
                      value={assessmentForm.nose}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, nose: e.target.value })}
                      placeholder="Discharge, septum, turbinates"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Throat</Label>
                    <Input
                      value={assessmentForm.throat}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, throat: e.target.value })}
                      placeholder="Pharynx, tonsils, uvula"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={assessmentForm.eentNotes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, eentNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="cardio" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heart Rate</Label>
                    <Input
                      value={assessmentForm.heartRate}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, heartRate: e.target.value })}
                      placeholder="e.g., 72 bpm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rhythm</Label>
                    <Input
                      value={assessmentForm.heartRhythm}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, heartRhythm: e.target.value })}
                      placeholder="Regular, Irregular"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heart Sounds</Label>
                    <Input
                      value={assessmentForm.heartSounds}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, heartSounds: e.target.value })}
                      placeholder="S1, S2, murmurs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peripheral Pulses</Label>
                    <Input
                      value={assessmentForm.peripheralPulses}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, peripheralPulses: e.target.value })}
                      placeholder="Radial, pedal, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capillary Refill</Label>
                    <Input
                      value={assessmentForm.capillaryRefill}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, capillaryRefill: e.target.value })}
                      placeholder="<2 seconds, delayed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={assessmentForm.cardiovascularNotes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, cardiovascularNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="respiratory" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Respiratory Rate</Label>
                    <Input
                      value={assessmentForm.respiratoryRate}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, respiratoryRate: e.target.value })}
                      placeholder="e.g., 16/min"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Breath Sounds</Label>
                    <Input
                      value={assessmentForm.breathSounds}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, breathSounds: e.target.value })}
                      placeholder="Clear, crackles, wheezes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chest Expansion</Label>
                    <Input
                      value={assessmentForm.chestExpansion}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, chestExpansion: e.target.value })}
                      placeholder="Symmetrical, asymmetrical"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cough</Label>
                    <Input
                      value={assessmentForm.cough}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, cough: e.target.value })}
                      placeholder="Productive, non-productive"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sputum</Label>
                    <Input
                      value={assessmentForm.sputum}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, sputum: e.target.value })}
                      placeholder="Color, consistency"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={assessmentForm.respiratoryNotes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, respiratoryNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="gi" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Abdomen</Label>
                    <Input
                      value={assessmentForm.abdomen}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, abdomen: e.target.value })}
                      placeholder="Soft, distended, tender"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bowel Sounds</Label>
                    <Input
                      value={assessmentForm.bowelSounds}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, bowelSounds: e.target.value })}
                      placeholder="Active, hypoactive, hyperactive"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Bowel Movement</Label>
                    <Input
                      value={assessmentForm.lastBowelMovement}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, lastBowelMovement: e.target.value })}
                      placeholder="Date/time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Appetite</Label>
                    <Input
                      value={assessmentForm.appetite}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, appetite: e.target.value })}
                      placeholder="Good, poor, nausea/vomiting"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={assessmentForm.giNotes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, giNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="gu" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bladder Palpation</Label>
                    <Input
                      value={assessmentForm.bladderPalpation}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, bladderPalpation: e.target.value })}
                      placeholder="Non-distended, distended"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Urinary Output</Label>
                    <Input
                      value={assessmentForm.urinaryOutput}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, urinaryOutput: e.target.value })}
                      placeholder="Amount, frequency"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Urine Color</Label>
                    <Input
                      value={assessmentForm.urinaryColor}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, urinaryColor: e.target.value })}
                      placeholder="Clear, amber, cloudy"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={assessmentForm.guNotes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, guNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="musculo" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gait</Label>
                    <Input
                      value={assessmentForm.gait}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, gait: e.target.value })}
                      placeholder="Steady, unsteady, assistive device"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Range of Motion</Label>
                    <Input
                      value={assessmentForm.rangeOfMotion}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, rangeOfMotion: e.target.value })}
                      placeholder="Full, limited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Muscle Strength</Label>
                    <Input
                      value={assessmentForm.muscleStrength}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, muscleStrength: e.target.value })}
                      placeholder="5/5, symmetrical"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={assessmentForm.jointSwelling}
                      onCheckedChange={(checked) => setAssessmentForm({ ...assessmentForm, jointSwelling: checked as boolean })}
                    />
                    <Label>Joint swelling present</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={assessmentForm.musculoskeletalNotes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, musculoskeletalNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="neuro" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Level of Consciousness</Label>
                    <Input
                      value={assessmentForm.consciousness}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, consciousness: e.target.value })}
                      placeholder="Alert, drowsy, confused"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Input
                      value={assessmentForm.orientation}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, orientation: e.target.value })}
                      placeholder="Person, place, time, situation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Speech</Label>
                    <Input
                      value={assessmentForm.speech}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, speech: e.target.value })}
                      placeholder="Clear, slurred, aphasia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pupils</Label>
                    <Input
                      value={assessmentForm.pupils}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, pupils: e.target.value })}
                      placeholder="PERRLA, size, reactivity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Motor Function</Label>
                    <Input
                      value={assessmentForm.motorFunction}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, motorFunction: e.target.value })}
                      placeholder="Moves all extremities"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sensory Function</Label>
                    <Input
                      value={assessmentForm.sensoryFunction}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, sensoryFunction: e.target.value })}
                      placeholder="Intact to light touch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reflexes</Label>
                    <Input
                      value={assessmentForm.reflexes}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, reflexes: e.target.value })}
                      placeholder="2+ bilateral"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={assessmentForm.neurologicalNotes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, neurologicalNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAssessmentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAssessment}>
                Save Assessment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Physical Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{patient.age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sex</p>
                    <p className="font-medium">{patient.sex}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{format(new Date(patient.date_of_birth), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{patient.contact_number || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{patient.address || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{patient.admit_to_department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{patient.admit_to_location || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PhilHealth</p>
                    <Badge variant={patient.philhealth ? "default" : "secondary"}>
                      {patient.philhealth ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diagnosis & Allergies */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Diagnosis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{patient.admitting_diagnosis || "No diagnosis recorded"}</p>
                  {patient.admitting_diagnosis && (
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Admitting Diagnosis: {patient.admitting_diagnosis}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Allergies</CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, idx) => (
                        <Badge key={idx} variant="destructive">{allergy}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No allergies recorded</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Medical History & Problem List */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>History of Present Illness</CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.history_of_present_illness ? (
                    <p className="text-sm">{patient.history_of_present_illness}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No history of present illness recorded</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Problem List</CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.problem_list && patient.problem_list.length > 0 ? (
                    <ul className="list-disc pl-4">
                      {patient.problem_list.map((p, i) => (
                        <li key={i} className="text-sm">{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No problems recorded</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admitting Diagnosis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{patient.admitting_diagnosis || "No admitting diagnosis"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Past Medical History & Personal/Social History */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Past Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderJsonData(patient.past_medical_history)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personal & Social History</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderJsonData(patient.personal_social_history)}
                </CardContent>
              </Card>
            </div>

            {/* Current Medications */}
            <Card>
              <CardHeader>
                <CardTitle>Current Medications</CardTitle>
              </CardHeader>
              <CardContent>
                {((patient.current_medications && patient.current_medications.length > 0) || medications.length > 0) ? (
                  <div className="space-y-2">
                    {patient.current_medications && patient.current_medications.length > 0 ? (
                      patient.current_medications.map((m: any, i: number) => (
                        <div key={`pmed-${i}`} className="flex justify-between items-start border-b pb-2">
                          <div>
                            <p className="font-medium">{typeof m === 'string' ? m : m.medication_name || JSON.stringify(m)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      medications.slice(0, 5).map((med) => (
                        <div key={med.id} className="flex justify-between items-start border-b pb-2">
                          <div>
                            <p className="font-medium">{med.medication_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {med.dosage} - {med.frequency} - {med.route}
                            </p>
                          </div>
                          <Badge variant="outline">{format(new Date(med.start_date), "MMM d")}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No medications recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Vital Signs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                {vitalSigns.length > 0 ? (
                  <div className="space-y-3">
                    {vitalSigns.map((vital) => (
                      <div key={vital.id} className="border-b pb-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          {format(new Date(vital.recorded_at), "PPp")}
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {vital.blood_pressure && (
                            <div>
                              <p className="text-xs text-muted-foreground">BP</p>
                              <p className="text-sm font-medium">{vital.blood_pressure}</p>
                            </div>
                          )}
                          {vital.heart_rate && (
                            <div>
                              <p className="text-xs text-muted-foreground">HR</p>
                              <p className="text-sm font-medium">{vital.heart_rate} bpm</p>
                            </div>
                          )}
                          {vital.respiratory_rate && (
                            <div>
                              <p className="text-xs text-muted-foreground">RR</p>
                              <p className="text-sm font-medium">{vital.respiratory_rate}</p>
                            </div>
                          )}
                          {vital.temperature && (
                            <div>
                              <p className="text-xs text-muted-foreground">Temp</p>
                              <p className="text-sm font-medium">{vital.temperature}°C</p>
                            </div>
                          )}
                          {vital.oxygen_saturation && (
                            <div>
                              <p className="text-xs text-muted-foreground">SpO2</p>
                              <p className="text-sm font-medium">{vital.oxygen_saturation}%</p>
                            </div>
                          )}
                          {vital.pain_scale && (
                            <div>
                              <p className="text-xs text-muted-foreground">Pain</p>
                              <p className="text-sm font-medium">{vital.pain_scale}/10</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No vital signs recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Lab Results & Imaging */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Recent Lab Results</CardTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingLab(null);
                      setShowLabDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {labs.length > 0 ? (
                    <div className="space-y-2">
                      {labs.map((lab) => (
                        <div key={lab.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium text-sm">{lab.test_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(lab.test_date), "MMM d, yyyy")}
                            </p>
                            {lab.test_result && (
                              <p className="text-sm mt-1">{lab.test_result}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingLab(lab);
                                setLabForm({
                                  test_name: lab.test_name,
                                  test_date: format(new Date(lab.test_date), "yyyy-MM-dd"),
                                  test_result: lab.test_result,
                                  reference_range: lab.reference_range || "",
                                  remarks: lab.remarks || ""
                                });
                                setShowLabDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLab(lab.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No lab results</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Recent Imaging</CardTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingImaging(null);
                      setShowImagingDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {imaging.length > 0 ? (
                    <div className="space-y-2">
                      {imaging.map((img) => (
                        <div key={img.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium text-sm">{img.imaging_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(img.imaging_date), "MMM d, yyyy")}
                            </p>
                            {img.findings && (
                              <p className="text-sm mt-1">{img.findings}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingImaging(img);
                                setImagingForm({
                                  imaging_type: img.imaging_type,
                                  imaging_date: format(new Date(img.imaging_date), "yyyy-MM-dd"),
                                  findings: img.findings,
                                  recommendation: img.recommendation || "",
                                  image_url: img.image_url || ""
                                });
                                setShowImagingDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteImaging(img.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No imaging results</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assessments">
          <div className="space-y-4">
            {physicalAssessments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No physical assessments recorded yet.
                </CardContent>
              </Card>
            ) : (
              physicalAssessments.map((assessment) => {
                const formatAssessmentData = (data: any) => {
                  if (!data) return "No data";
                  const entries = Object.entries(data).filter(([key, value]) => value);
                  if (entries.length === 0) return "No data";
                  return entries.map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
                      <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>
                    </div>
                  ));
                };

                return (
                  <Card key={assessment.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Assessment - {format(new Date(assessment.assessment_date), "PPp")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-primary mb-2">Skin Assessment</p>
                          {formatAssessmentData(assessment.skin_assessment)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-primary mb-2">EENT Assessment</p>
                          {formatAssessmentData(assessment.eent_assessment)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-primary mb-2">Cardiovascular</p>
                          {formatAssessmentData(assessment.cardiovascular_assessment)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-primary mb-2">Respiratory</p>
                          {formatAssessmentData(assessment.respiratory_assessment)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-primary mb-2">Gastrointestinal</p>
                          {formatAssessmentData(assessment.gastrointestinal_assessment)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-primary mb-2">Genitourinary</p>
                          {formatAssessmentData(assessment.genitourinary_assessment)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-primary mb-2">Musculoskeletal</p>
                          {formatAssessmentData(assessment.musculoskeletal_assessment)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-primary mb-2">Neurological</p>
                          {formatAssessmentData(assessment.neurological_assessment)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Lab Dialog */}
      <Dialog open={showLabDialog} onOpenChange={setShowLabDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLab ? "Edit Lab Result" : "Add Lab Result"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test_name">Test Name *</Label>
              <Input
                id="test_name"
                value={labForm.test_name}
                onChange={(e) => setLabForm(prev => ({ ...prev, test_name: e.target.value }))}
                placeholder="e.g., Complete Blood Count"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test_date">Test Date *</Label>
              <Input
                id="test_date"
                type="date"
                value={labForm.test_date}
                onChange={(e) => setLabForm(prev => ({ ...prev, test_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test_result">Result *</Label>
              <Textarea
                id="test_result"
                value={labForm.test_result}
                onChange={(e) => setLabForm(prev => ({ ...prev, test_result: e.target.value }))}
                placeholder="Enter test results"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_range">Reference Range</Label>
              <Input
                id="reference_range"
                value={labForm.reference_range}
                onChange={(e) => setLabForm(prev => ({ ...prev, reference_range: e.target.value }))}
                placeholder="e.g., 4.5-11.0 x10^9/L"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={labForm.remarks}
                onChange={(e) => setLabForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Additional notes or remarks"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowLabDialog(false);
              setEditingLab(null);
            }}>Cancel</Button>
            <Button 
              onClick={() => handleSaveLab(!editingLab)} 
              disabled={loading || !labForm.test_name || !labForm.test_date || !labForm.test_result}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Imaging Dialog */}
      <Dialog open={showImagingDialog} onOpenChange={setShowImagingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingImaging ? "Edit Imaging Record" : "Add Imaging Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imaging_type">Imaging Type *</Label>
              <Input
                id="imaging_type"
                value={imagingForm.imaging_type}
                onChange={(e) => setImagingForm(prev => ({ ...prev, imaging_type: e.target.value }))}
                placeholder="e.g., X-Ray, CT Scan, MRI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imaging_date">Date *</Label>
              <Input
                id="imaging_date"
                type="date"
                value={imagingForm.imaging_date}
                onChange={(e) => setImagingForm(prev => ({ ...prev, imaging_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="findings">Findings *</Label>
              <Textarea
                id="findings"
                value={imagingForm.findings}
                onChange={(e) => setImagingForm(prev => ({ ...prev, findings: e.target.value }))}
                placeholder="Enter imaging findings"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendation">Recommendation</Label>
              <Textarea
                id="recommendation"
                value={imagingForm.recommendation}
                onChange={(e) => setImagingForm(prev => ({ ...prev, recommendation: e.target.value }))}
                placeholder="Enter recommendations"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={imagingForm.image_url}
                onChange={(e) => setImagingForm(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="Link to image (optional)"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowImagingDialog(false);
              setEditingImaging(null);
            }}>Cancel</Button>
            <Button 
              onClick={() => handleSaveImaging(!editingImaging)} 
              disabled={loading || !imagingForm.imaging_type || !imagingForm.imaging_date || !imagingForm.findings}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <EditPatientDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        patient={patient}
        onSave={handleSavePatient}
        vitalSigns={vitalSigns}
        onVitalSignsSave={fetchPatientData}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
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
    </div>
  );
};

export default PatientRecord;
