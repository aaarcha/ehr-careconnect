import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Stethoscope, Edit, Trash2 } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

const specialties = [
  "Allergy and Immunology",
  "Anesthesiology",
  "Cardiology",
  "Colon and Rectal Surgery",
  "Dermatology",
  "Diagnostic Radiology",
  "Emergency Medicine",
  "Family Medicine",
  "General Surgery",
  "Internal Medicine",
  "Medical Genetics and Genomics",
  "Neurological Surgery",
  "Neurology",
  "Nuclear Medicine",
  "Obstetrics and Gynecology",
  "Occupational Medicine",
  "Ophthalmology",
  "Orthopaedic Surgery",
  "Otolaryngology (ENT)",
  "Pathology",
  "Pediatrics",
  "Physical Medicine and Rehabilitation (PM&R)",
  "Plastic Surgery",
  "Preventive Medicine",
  "Psychiatry",
  "Radiation Oncology",
  "Thoracic Surgery",
  "Urology",
];

const Decking = () => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    fetchDoctors();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        
        setUserRole(data?.role || null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async () => {
    if (!name || !specialty) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingDoctor) {
        const { error } = await supabase
          .from("doctors")
          .update({ name, specialty: specialty as any })
          .eq("id", editingDoctor.id);

        if (error) throw error;

        toast({
          title: "Doctor Updated",
          description: `Dr. ${name} has been updated.`,
        });
      } else {
        const { error } = await supabase
          .from("doctors")
          .insert([{ name, specialty: specialty as any }]);

        if (error) throw error;

        toast({
          title: "Doctor Added",
          description: `Dr. ${name} has been added to the directory.`,
        });
      }

      setName("");
      setSpecialty("");
      setEditingDoctor(null);
      setDialogOpen(false);
      fetchDoctors();
    } catch (error: any) {
      console.error("Error saving doctor:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save doctor",
        variant: "destructive",
      });
    }
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setSpecialty(doctor.specialty);
    setDialogOpen(true);
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;

    try {
      const { error } = await supabase
        .from("doctors")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Doctor Deleted",
        description: "Doctor has been removed from the directory.",
      });

      fetchDoctors();
    } catch (error: any) {
      console.error("Error deleting doctor:", error);
      toast({
        title: "Error",
        description: "Failed to delete doctor",
        variant: "destructive",
      });
    }
  };

  const canManageDoctors = userRole === "staff";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Doctor Directory</h1>
          <p className="text-muted-foreground">Browse our medical professionals</p>
        </div>
        {canManageDoctors && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDoctor ? "Edit" : "Add New"} Doctor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor Name</Label>
                  <Input
                    id="doctorName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Juan Dela Cruz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDoctor}>{editingDoctor ? "Update" : "Add"} Doctor</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Available Doctors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No doctors in the directory yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  {canManageDoctors && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.name}</TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    {canManageDoctors && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditDoctor(doctor)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteDoctor(doctor.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Decking;
