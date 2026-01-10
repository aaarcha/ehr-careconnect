import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { User, Activity, Pill, FileText, TestTube, Scan, Heart, Loader2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PatientData {
  id: string;
  name: string;
  hospital_number: string;
  date_of_birth: string;
  age: number;
  sex: string;
  address?: string;
  contact_number?: string;
  admitting_diagnosis?: string;
  attending_physician_id?: string;
  allergies?: string[];
  current_medications?: string[];
  problem_list?: string[];
  past_medical_history?: any;
  personal_social_history?: any;
  family_history?: any;
  history_present_illness?: string;
}

interface VitalSign {
  id: string;
  blood_pressure: string;
  heart_rate: number;
  respiratory_rate: number;
  temperature: number;
  oxygen_saturation: number;
  pain_scale: number;
  notes: string;
  recorded_at: string;
}

interface Lab {
  id: string;
  test_date: string;
  test_name: string;
  results: string;
  test_category?: string;
  normal_range?: string;
  unit?: string;
  flag?: string;
}

interface Imaging {
  id: string;
  imaging_date: string;
  imaging_type: string;
  findings?: string;
  category?: string;
}

interface Medication {
  id: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  start_date?: string;
  end_date?: string;
}

// Vital Signs Trend Charts Component
function VitalSignsTrendCharts({ vitalSigns }: { vitalSigns: VitalSign[] }) {
  // Prepare chart data - sort chronologically (oldest first for proper trend visualization)
  const chartData = useMemo(() => {
    return [...vitalSigns]
      .reverse()
      .map((vital) => {
        // Parse blood pressure to get systolic/diastolic
        const bpParts = vital.blood_pressure?.split('/') || [];
        const systolic = bpParts[0] ? parseInt(bpParts[0]) : null;
        const diastolic = bpParts[1] ? parseInt(bpParts[1]) : null;
        
        return {
          date: format(new Date(vital.recorded_at), 'MMM d'),
          fullDate: format(new Date(vital.recorded_at), 'MMM d, yyyy h:mm a'),
          heartRate: vital.heart_rate || null,
          temperature: vital.temperature || null,
          oxygenSaturation: vital.oxygen_saturation || null,
          respiratoryRate: vital.respiratory_rate || null,
          painScale: vital.pain_scale ?? null,
          systolic,
          diastolic,
        };
      });
  }, [vitalSigns]);

  if (vitalSigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No vital signs data available for trending.</p>
          <p className="text-sm text-muted-foreground">Charts will appear once vital signs are recorded.</p>
        </CardContent>
      </Card>
    );
  }

  if (vitalSigns.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Not enough data points for trending.</p>
          <p className="text-sm text-muted-foreground">At least 2 vital sign readings are needed to show trends.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Heart Rate Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            Heart Rate Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="heartRate" 
                name="Heart Rate (bpm)" 
                stroke="hsl(0, 84%, 60%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(0, 84%, 60%)' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Blood Pressure Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Blood Pressure Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="systolic" 
                name="Systolic (mmHg)" 
                stroke="hsl(220, 70%, 50%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(220, 70%, 50%)' }}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="diastolic" 
                name="Diastolic (mmHg)" 
                stroke="hsl(200, 70%, 50%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(200, 70%, 50%)' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Temperature Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-500" />
            Temperature Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis domain={[35, 40]} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                name="Temperature (°C)" 
                stroke="hsl(25, 95%, 53%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(25, 95%, 53%)' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Oxygen Saturation Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Oxygen Saturation Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="oxygenSaturation" 
                name="O2 Saturation (%)" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(142, 76%, 36%)' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MyRecords() {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [imaging, setImaging] = useState<Imaging[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [attendingDoctor, setAttendingDoctor] = useState<string | null>(null);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get patient number from user_roles
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('patient_number')
        .eq('user_id', user.id)
        .single();

      if (!roleData?.patient_number) {
        setLoading(false);
        return;
      }

      // Fetch patient data using hospital_number
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('hospital_number', roleData.patient_number)
        .single();

      if (patientError || !patientData) {
        console.error('Error fetching patient:', patientError);
        setLoading(false);
        return;
      }

      setPatient(patientData);

      // Fetch related data in parallel
      const [vitalsRes, labsRes, imagingRes, medsRes] = await Promise.all([
        supabase
          .from('patient_vital_signs')
          .select('*')
          .eq('patient_id', patientData.id)
          .order('recorded_at', { ascending: false })
          .limit(10),
        supabase
          .from('patient_labs')
          .select('*')
          .eq('patient_id', patientData.id)
          .order('test_date', { ascending: false }),
        supabase
          .from('patient_imaging')
          .select('*')
          .eq('patient_id', patientData.id)
          .order('imaging_date', { ascending: false }),
        supabase
          .from('patient_medications')
          .select('*')
          .eq('patient_id', patientData.id)
          .order('start_date', { ascending: false })
      ]);

      if (vitalsRes.data) setVitalSigns(vitalsRes.data);
      if (labsRes.data) setLabs(labsRes.data);
      if (imagingRes.data) setImaging(imagingRes.data);
      if (medsRes.data) setMedications(medsRes.data);

      // Fetch attending doctor name if exists
      if (patientData.attending_physician_id) {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('name')
          .eq('id', patientData.attending_physician_id)
          .single();
        
        if (doctorData) setAttendingDoctor(doctorData.name);
      }

    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-muted-foreground">No Patient Record Found</h2>
        <p className="text-sm text-muted-foreground">Your account is not linked to a patient record.</p>
      </div>
    );
  }

  const latestVitals = vitalSigns[0];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">My Medical Records</h1>
          <p className="text-muted-foreground">View your health information</p>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hospital Number</p>
              <p className="font-medium">{patient.hospital_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{format(new Date(patient.date_of_birth), 'MMMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-medium">{patient.age} years old</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sex</p>
              <p className="font-medium">{patient.sex}</p>
            </div>
            {patient.contact_number && (
              <div>
                <p className="text-sm text-muted-foreground">Contact Number</p>
                <p className="font-medium">{patient.contact_number}</p>
              </div>
            )}
            {patient.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            )}
            {attendingDoctor && (
              <div>
                <p className="text-sm text-muted-foreground">Attending Physician</p>
                <p className="font-medium">{attendingDoctor}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different record types */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="labs">Lab Results</TabsTrigger>
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Latest Vitals */}
          {latestVitals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  Latest Vital Signs
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {format(new Date(latestVitals.recorded_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Blood Pressure</p>
                    <p className="text-lg font-bold">{latestVitals.blood_pressure || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                    <p className="text-lg font-bold">{latestVitals.heart_rate || 'N/A'} <span className="text-xs">bpm</span></p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Temperature</p>
                    <p className="text-lg font-bold">{latestVitals.temperature || 'N/A'}°C</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Resp. Rate</p>
                    <p className="text-lg font-bold">{latestVitals.respiratory_rate || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">O2 Saturation</p>
                    <p className="text-lg font-bold">{latestVitals.oxygen_saturation || 'N/A'}%</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Pain Scale</p>
                    <p className="text-lg font-bold">{latestVitals.pain_scale ?? 'N/A'}/10</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnosis & Medical Info */}
          <div className="grid md:grid-cols-2 gap-4">
            {patient.admitting_diagnosis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Diagnosis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{patient.admitting_diagnosis}</p>
                </CardContent>
              </Card>
            )}

            {patient.allergies && patient.allergies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Allergies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="destructive">{allergy}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Problem List */}
          {patient.problem_list && patient.problem_list.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Problem List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {patient.problem_list.map((problem, idx) => (
                    <Badge key={idx} variant="secondary">{problem}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab - Vital Signs Charts */}
        <TabsContent value="trends" className="space-y-4">
          <VitalSignsTrendCharts vitalSigns={vitalSigns} />
        </TabsContent>

        {/* Vital Signs Tab */}
        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Vital Signs History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vitalSigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No vital signs recorded yet.</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {vitalSigns.map((vital) => (
                      <div key={vital.id} className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">
                          {format(new Date(vital.recorded_at), 'MMMM d, yyyy h:mm a')}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
                          <div><span className="text-muted-foreground">BP:</span> {vital.blood_pressure || 'N/A'}</div>
                          <div><span className="text-muted-foreground">HR:</span> {vital.heart_rate || 'N/A'} bpm</div>
                          <div><span className="text-muted-foreground">Temp:</span> {vital.temperature || 'N/A'}°C</div>
                          <div><span className="text-muted-foreground">RR:</span> {vital.respiratory_rate || 'N/A'}</div>
                          <div><span className="text-muted-foreground">O2:</span> {vital.oxygen_saturation || 'N/A'}%</div>
                          <div><span className="text-muted-foreground">Pain:</span> {vital.pain_scale ?? 'N/A'}/10</div>
                        </div>
                        {vital.notes && <p className="mt-2 text-sm text-muted-foreground">Notes: {vital.notes}</p>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No medications on record.</p>
              ) : (
                <div className="space-y-4">
                  {medications.map((med) => (
                    <div key={med.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{med.medication_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dosage} {med.route && `• ${med.route}`} {med.frequency && `• ${med.frequency}`}
                          </p>
                        </div>
                        {med.start_date && (
                          <Badge variant="outline">
                            Started: {format(new Date(med.start_date), 'MMM d, yyyy')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab Results Tab */}
        <TabsContent value="labs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Laboratory Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {labs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No lab results on record.</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Accordion type="single" collapsible className="w-full">
                    {labs.map((lab) => (
                      <AccordionItem key={lab.id} value={lab.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-4 text-left">
                            <span className="font-medium">{lab.test_name}</span>
                            {lab.flag && (
                              <Badge variant={lab.flag === 'HIGH' || lab.flag === 'LOW' ? 'destructive' : 'secondary'}>
                                {lab.flag}
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {lab.test_date && format(new Date(lab.test_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Result:</span>
                              <span className="font-medium">{lab.results} {lab.unit}</span>
                            </div>
                            {lab.normal_range && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Normal Range:</span>
                                <span>{lab.normal_range}</span>
                              </div>
                            )}
                            {lab.test_category && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Category:</span>
                                <span>{lab.test_category}</span>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Imaging Tab */}
        <TabsContent value="imaging">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Imaging Studies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imaging.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No imaging studies on record.</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {imaging.map((img) => (
                      <div key={img.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{img.imaging_type}</p>
                            {img.category && <Badge variant="outline">{img.category}</Badge>}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {img.imaging_date && format(new Date(img.imaging_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {img.findings && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Findings:</p>
                            <p className="text-sm">{img.findings}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
