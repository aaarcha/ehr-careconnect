import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { patientSchema, vitalSignsSchema } from "@/lib/validation";
import { z } from "zod";

const AddPatient = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  
  // Demographics
  const [hospitalNumber, setHospitalNumber] = useState("");
  const [patientNumber, setPatientNumber] = useState("");
  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [religion, setReligion] = useState("");
  const [occupation, setOccupation] = useState("");
  const [spouseGuardianName, setSpouseGuardianName] = useState("");
  const [spouseGuardianContact, setSpouseGuardianContact] = useState("");
  const [admitToDepartment, setAdmitToDepartment] = useState("");
  const [admitToLocation, setAdmitToLocation] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [attendingPhysicianId, setAttendingPhysicianId] = useState("");
  const [philhealth, setPhilhealth] = useState(false);
  
  // Medical History
  const [pastMedicalHistory, setPastMedicalHistory] = useState({
    hypertension: false,
    heartDisease: false,
    bronchialAsthma: false,
    diabetes: false,
    cancer: false,
    tuberculosis: false,
    hepatitis: false,
    kidneyDisease: false,
    others: ""
  });
  
  const [personalSocialHistory, setPersonalSocialHistory] = useState({
    smoker: false,
    alcoholic: false,
    occupation: ""
  });
  
  const [familyHistory, setFamilyHistory] = useState({
    hypertension: false,
    diabetes: false,
    heartDisease: false,
    cancer: false,
    tuberculosis: false,
    others: ""
  });
  
  const [historyPresentIllness, setHistoryPresentIllness] = useState("");
  const [problemList, setProblemList] = useState("");
  const [allergies, setAllergies] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [admittingDiagnosis, setAdmittingDiagnosis] = useState("");
  
  // Vital Signs
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [temperature, setTemperature] = useState("");
  const [painScale, setPainScale] = useState("");

  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = (h: string, w: string) => {
    const heightM = parseFloat(h) / 100;
    const weightKg = parseFloat(w);
    if (heightM > 0 && weightKg > 0) {
      return (weightKg / (heightM * heightM)).toFixed(2);
    }
    return "";
  };

  const handleSubmit = async () => {
    if (!hospitalNumber || !patientNumber || !name || !sex || !dateOfBirth) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields: Hospital Number, Patient Number, Name, Sex, and Date of Birth",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const age = calculateAge(dateOfBirth);
      const bmi = calculateBMI(height, weight);

      // Validate patient data
      const patientData = {
        hospital_number: hospitalNumber,
        patient_number: patientNumber,
        name,
        sex,
        date_of_birth: format(dateOfBirth, "yyyy-MM-dd"),
        age,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        contact_number: contactNumber,
        address,
        history_present_illness: historyPresentIllness,
        problem_list: problemList ? problemList.split(",").map(p => p.trim()) : null,
        allergies: allergies ? allergies.split(",").map(a => a.trim()) : null,
        current_medications: currentMedications ? currentMedications.split(",").map(m => m.trim()) : null,
        admitting_diagnosis: admittingDiagnosis,
      };

      try {
        patientSchema.parse(patientData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          toast({
            title: "Validation Error",
            description: validationError.errors[0].message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from("patients")
        .insert([{
          ...patientData,
          civil_status: civilStatus,
          place_of_birth: placeOfBirth,
          nationality,
          religion,
          occupation,
          spouse_guardian_name: spouseGuardianName,
          spouse_guardian_contact: spouseGuardianContact,
          admit_to_department: (admitToDepartment as any) || null,
          admit_to_location: admitToLocation,
          referred_by: referredBy,
          attending_physician_id: attendingPhysicianId || null,
          philhealth,
          past_medical_history: pastMedicalHistory,
          personal_social_history: personalSocialHistory,
          family_history: familyHistory,
          status: "active" as any
        }])
        .select()
        .single();

      if (error) throw error;

      // Add initial vital signs if provided
      if (data && (bloodPressure || heartRate || respiratoryRate)) {
        const vitalSignsData = {
          blood_pressure: bloodPressure,
          heart_rate: heartRate ? parseInt(heartRate) : null,
          respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : null,
          oxygen_saturation: oxygenSaturation ? parseFloat(oxygenSaturation) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          pain_scale: painScale ? parseInt(painScale) : null,
        };

        try {
          vitalSignsSchema.parse(vitalSignsData);
          
          await supabase.from("patient_vital_signs").insert({
            patient_id: data.id,
            ...vitalSignsData,
            notes: "Initial vital signs"
          });
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            toast({
              title: "Vital Signs Validation Error",
              description: validationError.errors[0].message,
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Patient Added Successfully",
        description: `Patient ${name} has been added to the system.`,
      });

      navigate("/dashboard/patients");
    } catch (error: any) {
      console.error("Error adding patient:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add patient",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-primary">Add New Patient</h1>
      
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs & Medical History</TabsTrigger>
          <TabsTrigger value="assessment">Physical Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics">
          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hospitalNumber">Hospital Number *</Label>
                  <Input
                    id="hospitalNumber"
                    value={hospitalNumber}
                    onChange={(e) => setHospitalNumber(e.target.value)}
                    placeholder="e.g., H2025001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patientNumber">Patient Number (Login ID) *</Label>
                  <Input
                    id="patientNumber"
                    value={patientNumber}
                    onChange={(e) => setPatientNumber(e.target.value)}
                    placeholder="e.g., P2025001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Last Name, First Name M.I."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sex">Sex *</Label>
                  <Select value={sex} onValueChange={setSex}>
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
                  <Label>Date of Birth *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfBirth ? format(dateOfBirth, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateOfBirth}
                        onSelect={setDateOfBirth}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={dateOfBirth ? calculateAge(dateOfBirth) : ""}
                    disabled
                    placeholder="Auto-calculated"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="65"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bmi">BMI</Label>
                  <Input
                    id="bmi"
                    value={calculateBMI(height, weight)}
                    disabled
                    placeholder="Auto-calculated"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="civilStatus">Civil Status</Label>
                  <Select value={civilStatus} onValueChange={setCivilStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                      <SelectItem value="Separated">Separated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth">Place of Birth</Label>
                  <Input
                    id="placeOfBirth"
                    value={placeOfBirth}
                    onChange={(e) => setPlaceOfBirth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Filipino"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Input
                    id="religion"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spouseGuardianName">Spouse/Guardian Name</Label>
                  <Input
                    id="spouseGuardianName"
                    value={spouseGuardianName}
                    onChange={(e) => setSpouseGuardianName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spouseGuardianContact">Spouse/Guardian Contact</Label>
                  <Input
                    id="spouseGuardianContact"
                    value={spouseGuardianContact}
                    onChange={(e) => setSpouseGuardianContact(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admitToDepartment">Admit to Department</Label>
                  <Select value={admitToDepartment} onValueChange={setAdmitToDepartment}>
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
                  <Label htmlFor="admitToLocation">Location/Bed</Label>
                  <Input
                    id="admitToLocation"
                    value={admitToLocation}
                    onChange={(e) => setAdmitToLocation(e.target.value)}
                    placeholder="e.g., Room 101, Bed 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referredBy">Referred By</Label>
                  <Input
                    id="referredBy"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>PhilHealth</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="philhealth"
                      checked={philhealth}
                      onCheckedChange={(checked) => setPhilhealth(checked as boolean)}
                    />
                    <label htmlFor="philhealth" className="text-sm">Patient has PhilHealth</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs & Medical History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Initial Vital Signs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Initial Vital Signs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bloodPressure">Blood Pressure</Label>
                    <Input
                      id="bloodPressure"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      placeholder="120/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                    <Input
                      id="heartRate"
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="72"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
                    <Input
                      id="respiratoryRate"
                      type="number"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      placeholder="16"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oxygenSaturation">O2 Saturation (%)</Label>
                    <Input
                      id="oxygenSaturation"
                      type="number"
                      value={oxygenSaturation}
                      onChange={(e) => setOxygenSaturation(e.target.value)}
                      placeholder="98"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="36.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="painScale">Pain Scale (0-10)</Label>
                    <Input
                      id="painScale"
                      type="number"
                      value={painScale}
                      onChange={(e) => setPainScale(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Past Medical History */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Past Medical History</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(pastMedicalHistory).map(([key, value]) => {
                    if (key === "others") return null;
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={value as boolean}
                          onCheckedChange={(checked) =>
                            setPastMedicalHistory({ ...pastMedicalHistory, [key]: checked })
                          }
                        />
                        <label htmlFor={key} className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pmhOthers">Others</Label>
                  <Input
                    id="pmhOthers"
                    value={pastMedicalHistory.others}
                    onChange={(e) =>
                      setPastMedicalHistory({ ...pastMedicalHistory, others: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Personal & Social History */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal & Social History</h3>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smoker"
                      checked={personalSocialHistory.smoker}
                      onCheckedChange={(checked) =>
                        setPersonalSocialHistory({ ...personalSocialHistory, smoker: checked as boolean })
                      }
                    />
                    <label htmlFor="smoker" className="text-sm">Smoker</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="alcoholic"
                      checked={personalSocialHistory.alcoholic}
                      onCheckedChange={(checked) =>
                        setPersonalSocialHistory({ ...personalSocialHistory, alcoholic: checked as boolean })
                      }
                    />
                    <label htmlFor="alcoholic" className="text-sm">Alcoholic Beverage Drinker</label>
                  </div>
                </div>
              </div>

              {/* Family History */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Family History</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(familyHistory).map(([key, value]) => {
                    if (key === "others") return null;
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`fh-${key}`}
                          checked={value as boolean}
                          onCheckedChange={(checked) =>
                            setFamilyHistory({ ...familyHistory, [key]: checked })
                          }
                        />
                        <label htmlFor={`fh-${key}`} className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fhOthers">Others</Label>
                  <Input
                    id="fhOthers"
                    value={familyHistory.others}
                    onChange={(e) => setFamilyHistory({ ...familyHistory, others: e.target.value })}
                  />
                </div>
              </div>

              {/* History of Present Illness */}
              <div className="space-y-2">
                <Label htmlFor="historyPresentIllness">History of Present Illness</Label>
                <Textarea
                  id="historyPresentIllness"
                  value={historyPresentIllness}
                  onChange={(e) => setHistoryPresentIllness(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Problem List */}
              <div className="space-y-2">
                <Label htmlFor="problemList">Problem List (comma-separated)</Label>
                <Input
                  id="problemList"
                  value={problemList}
                  onChange={(e) => setProblemList(e.target.value)}
                  placeholder="e.g., Hypertension, Diabetes"
                />
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                <Input
                  id="allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g., Penicillin, Shellfish"
                />
              </div>

              {/* Current Medications */}
              <div className="space-y-2">
                <Label htmlFor="currentMedications">Current Medications (comma-separated)</Label>
                <Input
                  id="currentMedications"
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="e.g., Aspirin 100mg, Metformin 500mg"
                />
              </div>

              {/* Admitting Diagnosis */}
              <div className="space-y-2">
                <Label htmlFor="admittingDiagnosis">Admitting Diagnosis</Label>
                <Textarea
                  id="admittingDiagnosis"
                  value={admittingDiagnosis}
                  onChange={(e) => setAdmittingDiagnosis(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle>Physical Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Physical assessment will be added after patient admission.
                <br />
                You can add detailed assessments from the Patient Records section.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate("/dashboard/patients")}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Patient
        </Button>
      </div>
    </div>
  );
};

export default AddPatient;
