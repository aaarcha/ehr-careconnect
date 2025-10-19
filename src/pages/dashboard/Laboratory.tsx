import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, TestTube, Settings } from "lucide-react";
import { format } from "date-fns";

interface MedTech {
  id: string;
  name: string;
  account_number: string;
}

interface LabTest {
  id: string;
  patient_id: string;
  test_name: string;
  test_category: string;
  result_value: number;
  normal_range: string;
  unit: string;
  flag: string | null;
  test_date: string;
  notes: string;
  performed_by: string;
}

interface Patient {
  id: string;
  name: string;
  hospital_number: string;
}

// Comprehensive lab normal values reference
const LAB_TESTS = {
  "Hematology": {
    "WBC": { range: "4.5-11.0", unit: "x10^9/L" },
    "RBC Male": { range: "4.5-5.9", unit: "x10^12/L" },
    "RBC Female": { range: "4.0-5.2", unit: "x10^12/L" },
    "Hemoglobin Male": { range: "14-17", unit: "g/dL" },
    "Hemoglobin Female": { range: "12-16", unit: "g/dL" },
    "Hematocrit Male": { range: "42-52", unit: "%" },
    "Hematocrit Female": { range: "37-47", unit: "%" },
    "MCV": { range: "80-100", unit: "fL" },
    "MCH": { range: "27-31", unit: "pg" },
    "MCHC": { range: "32-36", unit: "g/dL" },
    "Platelet Count": { range: "150-400", unit: "x10^9/L" },
  },
  "Chemistries": {
    "Glucose Fasting": { range: "70-100", unit: "mg/dL" },
    "Glucose Random": { range: "70-140", unit: "mg/dL" },
    "BUN": { range: "7-20", unit: "mg/dL" },
    "Creatinine Male": { range: "0.7-1.3", unit: "mg/dL" },
    "Creatinine Female": { range: "0.6-1.1", unit: "mg/dL" },
    "Uric Acid Male": { range: "3.5-7.2", unit: "mg/dL" },
    "Uric Acid Female": { range: "2.6-6.0", unit: "mg/dL" },
    "Total Cholesterol": { range: "140-200", unit: "mg/dL" },
    "Triglycerides": { range: "40-160", unit: "mg/dL" },
    "HDL Male": { range: "40-50", unit: "mg/dL" },
    "HDL Female": { range: "50-60", unit: "mg/dL" },
    "LDL": { range: "0-100", unit: "mg/dL" },
    "Sodium": { range: "136-145", unit: "mmol/L" },
    "Potassium": { range: "3.5-5.0", unit: "mmol/L" },
    "Chloride": { range: "98-107", unit: "mmol/L" },
    "Calcium": { range: "8.5-10.5", unit: "mg/dL" },
  },
  "Liver Function": {
    "Total Bilirubin": { range: "0.3-1.0", unit: "mg/dL" },
    "Direct Bilirubin": { range: "0.1-0.3", unit: "mg/dL" },
    "SGOT (AST)": { range: "0-40", unit: "U/L" },
    "SGPT (ALT)": { range: "0-41", unit: "U/L" },
    "ALP": { range: "30-120", unit: "U/L" },
    "Total Protein": { range: "6.0-8.3", unit: "g/dL" },
    "Albumin": { range: "3.5-5.5", unit: "g/dL" },
  },
  "Endocrinology": {
    "TSH": { range: "0.4-4.0", unit: "mIU/L" },
    "T3": { range: "80-200", unit: "ng/dL" },
    "T4": { range: "5.0-12.0", unit: "μg/dL" },
    "HbA1c": { range: "4.0-5.6", unit: "%" },
  },
  "Coagulation": {
    "PT": { range: "11-13.5", unit: "seconds" },
    "INR": { range: "0.8-1.2", unit: "ratio" },
    "APTT": { range: "25-35", unit: "seconds" },
  }
};

const Laboratory = () => {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [medtechs, setMedTechs] = useState<MedTech[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showMedtechDialog, setShowMedtechDialog] = useState(false);
  const [editingMedtech, setEditingMedtech] = useState<MedTech | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    patient_id: "",
    test_category: "",
    test_name: "",
    result_value: "",
    normal_range: "",
    unit: "",
    notes: "",
  });

  const [medtechForm, setMedtechForm] = useState({
    name: "",
    account_number: "",
  });

  useEffect(() => {
    fetchLabTests();
    fetchMedTechs();
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

  const fetchLabTests = async () => {
    const { data, error } = await supabase
      .from("patient_labs")
      .select(`
        *,
        patients(name, hospital_number)
      `)
      .order("test_date", { ascending: false });
    
    if (error) {
      toast.error("Error fetching lab tests");
      return;
    }
    setLabTests(data || []);
  };

  const fetchMedTechs = async () => {
    const { data, error } = await supabase
      .from("medtechs")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      toast.error("Error fetching medical technologists");
      return;
    }
    setMedTechs(data || []);
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

  const handleTestCategoryChange = (category: string) => {
    setFormData({ ...formData, test_category: category, test_name: "" });
  };

  const handleTestNameChange = (testName: string) => {
    const category = formData.test_category;
    if (category && LAB_TESTS[category as keyof typeof LAB_TESTS]) {
      const testData = LAB_TESTS[category as keyof typeof LAB_TESTS][testName as any];
      if (testData) {
        setFormData({
          ...formData,
          test_name: testName,
          normal_range: testData.range,
          unit: testData.unit,
        });
      }
    }
  };

  const calculateFlag = (value: number, range: string): string => {
    const [min, max] = range.split("-").map(Number);
    if (value < min) return "Low";
    if (value > max) return "High";
    return "Normal";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.test_name || !formData.result_value) {
      toast.error("Please fill in all required fields");
      return;
    }

    const flag = calculateFlag(parseFloat(formData.result_value), formData.normal_range);

    try {
      const { error } = await supabase.from("patient_labs").insert([{
        patient_id: formData.patient_id,
        test_category: formData.test_category,
        test_name: formData.test_name,
        result_value: parseFloat(formData.result_value),
        normal_range: formData.normal_range,
        unit: formData.unit,
        flag: flag,
        notes: formData.notes,
      }]);
      
      if (error) throw error;
      toast.success("Lab test added successfully");
      setShowDialog(false);
      setFormData({
        patient_id: "",
        test_category: "",
        test_name: "",
        result_value: "",
        normal_range: "",
        unit: "",
        notes: "",
      });
      fetchLabTests();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMedtechSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMedtech) {
        const { error } = await supabase
          .from("medtechs")
          .update({ name: medtechForm.name, account_number: medtechForm.account_number })
          .eq("id", editingMedtech.id);
        
        if (error) throw error;
        toast.success("MedTech updated successfully");
      } else {
        const { error } = await supabase
          .from("medtechs")
          .insert([medtechForm]);
        
        if (error) throw error;
        toast.success("MedTech added successfully");
      }
      
      setShowMedtechDialog(false);
      setMedtechForm({ name: "", account_number: "" });
      setEditingMedtech(null);
      fetchMedTechs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteMedtech = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medical technologist?")) return;
    
    const { error } = await supabase
      .from("medtechs")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("Error deleting medical technologist");
      return;
    }
    
    toast.success("MedTech deleted");
    fetchMedTechs();
  };

  const handleEditMedtech = (medtech: MedTech) => {
    setEditingMedtech(medtech);
    setMedtechForm({ name: medtech.name, account_number: medtech.account_number });
    setShowMedtechDialog(true);
  };

  const getRowColor = (flag: string | null) => {
    if (flag === "High") return "bg-red-50 hover:bg-red-100";
    if (flag === "Low") return "bg-green-50 hover:bg-green-100";
    return "";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            Laboratory
          </h1>
          <p className="text-muted-foreground">Manage laboratory tests and results</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lab Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Laboratory Test Result</DialogTitle>
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
                    <Label>Test Category</Label>
                    <Select value={formData.test_category} onValueChange={handleTestCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(LAB_TESTS).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Test Name</Label>
                    <Select 
                      value={formData.test_name} 
                      onValueChange={handleTestNameChange}
                      disabled={!formData.test_category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select test" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.test_category && Object.keys(LAB_TESTS[formData.test_category as keyof typeof LAB_TESTS]).map((test) => (
                          <SelectItem key={test} value={test}>
                            {test}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Result Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.result_value}
                      onChange={(e) => setFormData({ ...formData, result_value: e.target.value })}
                      placeholder="Enter result"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Normal Range</Label>
                    <Input
                      value={formData.normal_range}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      readOnly
                      className="bg-muted"
                    />
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
                  <Button type="submit" className="flex-1">
                    Add Test Result
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {userRole === "staff" && (
            <Dialog open={showMedtechDialog} onOpenChange={setShowMedtechDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage MedTechs
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Medical Technologists</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleMedtechSubmit} className="space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={medtechForm.name}
                        onChange={(e) => setMedtechForm({ ...medtechForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        value={medtechForm.account_number}
                        onChange={(e) => setMedtechForm({ ...medtechForm, account_number: e.target.value })}
                        placeholder="e.g., MED001"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingMedtech ? "Update" : "Add"} MedTech
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
                      {medtechs.map((medtech) => (
                        <TableRow key={medtech.id}>
                          <TableCell>{medtech.name}</TableCell>
                          <TableCell>{medtech.account_number}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditMedtech(medtech)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteMedtech(medtech.id)}>
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

      <Card>
        <CardHeader>
          <CardTitle>Laboratory Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Normal Range</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No lab tests recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                labTests.map((test) => (
                  <TableRow key={test.id} className={getRowColor(test.flag)}>
                    <TableCell>{format(new Date(test.test_date), "MMM d, yyyy HH:mm")}</TableCell>
                    <TableCell>{(test as any).patients?.name}</TableCell>
                    <TableCell className="font-medium">{test.test_name}</TableCell>
                    <TableCell className="font-bold">{test.result_value}</TableCell>
                    <TableCell>{test.normal_range}</TableCell>
                    <TableCell>{test.unit}</TableCell>
                    <TableCell>
                      {test.flag && (
                        <span className={`font-semibold ${
                          test.flag === "High" ? "text-red-600" : 
                          test.flag === "Low" ? "text-green-600" : 
                          "text-gray-600"
                        }`}>
                          {test.flag}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Laboratory;