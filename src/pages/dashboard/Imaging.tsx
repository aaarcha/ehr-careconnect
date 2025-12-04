import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Scan, Settings, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { imagingSchema } from "@/lib/validation";
import { z } from "zod";

interface RadTech {
  id: string;
  name: string;
  account_number: string;
}

interface ImagingResult {
  id: string;
  patient_id: string;
  category: string;
  imaging_type: string;
  findings: string;
  notes: string;
  image_url: string;
  imaging_date: string;
  patients?: {
    name: string;
    hospital_number: string;
  };
}

interface Patient {
  id: string;
  name: string;
  hospital_number: string;
}

const IMAGING_CATEGORIES = [
  "X-ray",
  "CT Scan",
  "MRI",
  "Ultrasound",
  "Mammography",
  "PET Scan",
  "Fluoroscopy"
];

const Imaging = () => {
  const [imagingResults, setImagingResults] = useState<ImagingResult[]>([]);
  const [radtechs, setRadTechs] = useState<RadTech[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showRadtechDialog, setShowRadtechDialog] = useState(false);
  const [editingRadtech, setEditingRadtech] = useState<RadTech | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("X-ray");
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    patient_id: "",
    category: "",
    imaging_type: "",
    findings: "",
    notes: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [radtechForm, setRadtechForm] = useState({
    name: "",
    account_number: "",
  });

  useEffect(() => {
    fetchImagingResults();
    fetchRadTechs();
    fetchPatients();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      setUserRole(data?.role || null);
    }
  };

  const fetchImagingResults = async () => {
    const { data, error } = await supabase
      .from("patient_imaging")
      .select(`
        *,
        patients(name, hospital_number)
      `)
      .order("imaging_date", { ascending: false });
    
    if (error) {
      toast.error("Error fetching imaging results");
      return;
    }
    setImagingResults(data || []);
  };

  const fetchRadTechs = async () => {
    const { data, error } = await supabase
      .from("radtechs")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      toast.error("Error fetching radiologic technologists");
      return;
    }
    setRadTechs(data || []);
  };

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, name, hospital_number")
      .eq("status", "active")
      .order("name", { ascending: true });
    
    if (error) {
      toast.error("Error fetching patients");
      return;
    }
    setPatients(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.category || !formData.imaging_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    let image_url = "";

    try {
      // Upload file if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${formData.patient_id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('imaging-files')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('imaging-files')
          .getPublicUrl(fileName);
        
        image_url = publicUrl;
      }

      const imagingData = {
        patient_id: formData.patient_id,
        category: formData.category,
        imaging_type: formData.imaging_type,
        findings: formData.findings,
        notes: formData.notes,
        image_url,
      };

      try {
        imagingSchema.parse(imagingData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          toast.error(validationError.errors[0].message);
          return;
        }
      }

      const { error } = await supabase.from("patient_imaging").insert([imagingData]);
      
      if (error) throw error;
      toast.success("Imaging result added successfully");
      setShowDialog(false);
      setFormData({
        patient_id: "",
        category: "",
        imaging_type: "",
        findings: "",
        notes: "",
      });
      setImageFile(null);
      fetchImagingResults();
    } catch (error: any) {
      toast.error("Failed to add imaging result: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRadtechSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRadtech) {
        const { error } = await supabase
          .from("radtechs")
          .update({ name: radtechForm.name, account_number: radtechForm.account_number })
          .eq("id", editingRadtech.id);
        
        if (error) throw error;
        toast.success("RadTech updated successfully");
      } else {
        const { error } = await supabase
          .from("radtechs")
          .insert([radtechForm]);
        
        if (error) throw error;
        toast.success("RadTech added successfully");
      }
      
      setShowRadtechDialog(false);
      setRadtechForm({ name: "", account_number: "" });
      setEditingRadtech(null);
      fetchRadTechs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteRadtech = async (id: string) => {
    if (!confirm("Are you sure you want to delete this radiologic technologist?")) return;
    
    const { error } = await supabase
      .from("radtechs")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("Error deleting radiologic technologist");
      return;
    }
    
    toast.success("RadTech deleted");
    fetchRadTechs();
  };

  const handleEditRadtech = (radtech: RadTech) => {
    setEditingRadtech(radtech);
    setRadtechForm({ name: radtech.name, account_number: radtech.account_number });
    setShowRadtechDialog(true);
  };

  const filterByCategory = (category: string) => {
    return imagingResults.filter(result => result.category === category);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Scan className="h-8 w-8" />
            Imaging
          </h1>
          <p className="text-muted-foreground">Manage radiologic imaging and results</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Imaging Result
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Imaging Result</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Patient</Label>
                    <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} - {patient.hospital_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGING_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Imaging Type</Label>
                    <Input
                      value={formData.imaging_type}
                      onChange={(e) => setFormData({ ...formData, imaging_type: e.target.value })}
                      placeholder="e.g., Chest X-ray PA view"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label>Findings</Label>
                    <Textarea
                      value={formData.findings}
                      onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                      placeholder="Describe imaging findings"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label>Upload Image (Optional)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    {imageFile && (
                      <p className="text-sm text-muted-foreground">Selected: {imageFile.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? "Uploading..." : "Add Result"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {userRole === "staff" && (
            <Dialog open={showRadtechDialog} onOpenChange={setShowRadtechDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage RadTechs
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Radiologic Technologists</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleRadtechSubmit} className="space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={radtechForm.name}
                        onChange={(e) => setRadtechForm({ ...radtechForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        value={radtechForm.account_number}
                        onChange={(e) => setRadtechForm({ ...radtechForm, account_number: e.target.value })}
                        placeholder="e.g., RAD001"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingRadtech ? "Update" : "Add"} RadTech
                  </Button>
                </form>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Account Number</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {radtechs.map((radtech) => (
                        <TableRow key={radtech.id}>
                          <TableCell>{radtech.name}</TableCell>
                          <TableCell>{radtech.account_number}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditRadtech(radtech)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteRadtech(radtech.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-7 w-full">
          {IMAGING_CATEGORIES.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {IMAGING_CATEGORIES.map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterByCategory(category).length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                      No {category} results recorded yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterByCategory(category).map((result) => (
                  <Card key={result.id} className="hover:shadow-elegant transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {result.patients?.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(result.imaging_date), "MMM d, yyyy • HH:mm")}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Type:</p>
                        <p className="text-sm text-muted-foreground">{result.imaging_type}</p>
                      </div>
                      
                      {result.findings && (
                        <div>
                          <p className="text-sm font-medium">Findings:</p>
                          <p className="text-sm text-muted-foreground">{result.findings}</p>
                        </div>
                      )}
                      
                      {result.image_url && (
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={result.image_url} 
                            alt={result.imaging_type}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage not available%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Imaging;