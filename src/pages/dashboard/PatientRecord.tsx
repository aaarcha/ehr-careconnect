import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Patient {
  id: string;
  hospital_number: string;
  name: string;
  age: number;
  sex: string;
  date_of_birth: string;
  address: string;
  contact_number: string;
}

interface PhysicalAssessment {
  id: string;
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

const PatientRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [physicalAssessments, setPhysicalAssessments] = useState<PhysicalAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
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

      // Fetch physical assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from("physical_assessments")
        .select("*")
        .eq("patient_id", id)
        .order("assessment_date", { ascending: false });

      if (assessmentsError) throw assessmentsError;
      setPhysicalAssessments(assessmentsData || []);
    } catch (error: any) {
      toast.error("Error loading patient data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async () => {
    try {
      const { error } = await supabase.from("physical_assessments").insert({
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
      });

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/dashboard/patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{patient.name}</h1>
            <p className="text-muted-foreground">Hospital No: {patient.hospital_number}</p>
          </div>
        </div>
        
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Physical Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <p className="font-medium">{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{patient.contact_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{patient.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
              physicalAssessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Assessment - {new Date(assessment.assessment_date).toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-sm text-primary">Skin</p>
                        <p className="text-sm">{JSON.stringify(assessment.skin_assessment)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-primary">EENT</p>
                        <p className="text-sm">{JSON.stringify(assessment.eent_assessment)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-primary">Cardiovascular</p>
                        <p className="text-sm">{JSON.stringify(assessment.cardiovascular_assessment)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-primary">Respiratory</p>
                        <p className="text-sm">{JSON.stringify(assessment.respiratory_assessment)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-primary">Gastrointestinal</p>
                        <p className="text-sm">{JSON.stringify(assessment.gastrointestinal_assessment)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-primary">Genitourinary</p>
                        <p className="text-sm">{JSON.stringify(assessment.genitourinary_assessment)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-primary">Musculoskeletal</p>
                        <p className="text-sm">{JSON.stringify(assessment.musculoskeletal_assessment)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-primary">Neurological</p>
                        <p className="text-sm">{JSON.stringify(assessment.neurological_assessment)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientRecord;
