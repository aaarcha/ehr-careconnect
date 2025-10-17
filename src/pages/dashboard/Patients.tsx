import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Eye, Archive, UserPlus, Search } from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  hospital_number: string;
  name: string;
  age: number;
  sex: string;
  date_of_birth: string;
  status: string;
  admit_to_department: string;
  admit_to_location: string;
  admitting_diagnosis: string;
  created_at: string;
}

const Patients = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activePatients, setActivePatients] = useState<Patient[]>([]);
  const [archivedPatients, setArchivedPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const active = data?.filter((p) => p.status === "active") || [];
      const archived = data?.filter((p) => p.status === "archived") || [];

      setActivePatients(active);
      setArchivedPatients(archived);
    } catch (error: any) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchivePatient = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from("patients")
        .update({ status: "archived" })
        .eq("id", patientId);

      if (error) throw error;

      toast({
        title: "Patient Archived",
        description: "Patient has been moved to archive.",
      });

      fetchPatients();
      setDetailsOpen(false);
    } catch (error: any) {
      console.error("Error archiving patient:", error);
      toast({
        title: "Error",
        description: "Failed to archive patient",
        variant: "destructive",
      });
    }
  };

  const handleViewPatient = (patient: Patient) => {
    navigate(`/dashboard/patients/${patient.id}`);
  };

  const filterPatients = (patients: Patient[]) => {
    if (!searchTerm) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.hospital_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const PatientTable = ({ patients, showArchive }: { patients: Patient[]; showArchive?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hospital No.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Age/Sex</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Admitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No patients found
            </TableCell>
          </TableRow>
        ) : (
          patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">{patient.hospital_number}</TableCell>
              <TableCell>{patient.name}</TableCell>
              <TableCell>
                {patient.age} / {patient.sex}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{patient.admit_to_department || "N/A"}</Badge>
              </TableCell>
              <TableCell>{format(new Date(patient.created_at), "MMM d, yyyy")}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleViewPatient(patient)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!showArchive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleArchivePatient(patient.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Patient Records</h1>
        <Button onClick={() => navigate("/dashboard/add-patient")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or hospital number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activePatients.length})</TabsTrigger>
          <TabsTrigger value="archived">Archive ({archivedPatients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Patients</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <PatientTable patients={filterPatients(activePatients)} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Archived Patients</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <PatientTable patients={filterPatients(archivedPatients)} showArchive />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Overview</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hospital Number</p>
                  <p className="font-medium">{selectedPatient.hospital_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedPatient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{selectedPatient.age}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sex</p>
                  <p className="font-medium">{selectedPatient.sex}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {format(new Date(selectedPatient.date_of_birth), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedPatient.admit_to_department || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedPatient.admit_to_location || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedPatient.status === "active" ? "default" : "secondary"}>
                    {selectedPatient.status}
                  </Badge>
                </div>
              </div>

              {selectedPatient.admitting_diagnosis && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Admitting Diagnosis</p>
                  <p className="text-sm">{selectedPatient.admitting_diagnosis}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => navigate(`/dashboard/patient/${selectedPatient.id}`)}>
                  View Full Record
                </Button>
                {selectedPatient.status === "active" && (
                  <Button
                    variant="outline"
                    onClick={() => handleArchivePatient(selectedPatient.id)}
                  >
                    Archive Patient
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;
