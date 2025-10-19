import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, Plus, Edit, Trash2 } from "lucide-react";

interface Nurse {
  id: string;
  name: string;
  nurse_no: string;
  department: string;
}

const Nurses = () => {
  const { toast } = useToast();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [newNurse, setNewNurse] = useState<{
    name: string;
    nurse_no: string;
    department: "WARD" | "OR" | "ICU" | "ER" | "HEMO" | "";
  }>({
    name: "",
    nurse_no: "",
    department: "",
  });

  useEffect(() => {
    fetchNurses();
  }, []);

  const fetchNurses = async () => {
    try {
      const { data, error } = await supabase
        .from("nurses")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setNurses(data || []);
    } catch (error: any) {
      console.error("Error fetching nurses:", error);
      toast({
        title: "Error",
        description: "Failed to load nurses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNurse = async () => {
    if (!newNurse.name || !newNurse.nurse_no || !newNurse.department) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingNurse) {
        const { error } = await supabase
          .from("nurses")
          .update({
            name: newNurse.name,
            nurse_no: newNurse.nurse_no,
            department: newNurse.department as any
          })
          .eq("id", editingNurse.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Nurse updated successfully",
        });
      } else {
        const { error } = await supabase.from("nurses").insert([{
          name: newNurse.name,
          nurse_no: newNurse.nurse_no,
          department: newNurse.department as any
        }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Nurse added successfully",
        });
      }

      setShowAddDialog(false);
      setEditingNurse(null);
      setNewNurse({ name: "", nurse_no: "", department: "" });
      fetchNurses();
    } catch (error: any) {
      console.error("Error saving nurse:", error);
      toast({
        title: "Error",
        description: "Failed to save nurse",
        variant: "destructive",
      });
    }
  };

  const handleEditNurse = (nurse: Nurse) => {
    setEditingNurse(nurse);
    setNewNurse({
      name: nurse.name,
      nurse_no: nurse.nurse_no,
      department: nurse.department as any
    });
    setShowAddDialog(true);
  };

  const handleDeleteNurse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this nurse?")) return;

    try {
      const { error } = await supabase
        .from("nurses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Nurse deleted successfully",
      });

      fetchNurses();
    } catch (error: any) {
      console.error("Error deleting nurse:", error);
      toast({
        title: "Error",
        description: "Failed to delete nurse",
        variant: "destructive",
      });
    }
  };

  const getNursesByDepartment = (department: string) => {
    return nurses.filter((nurse) => nurse.department === department);
  };

  const NurseTable = ({ department }: { department: string }) => {
    const departmentNurses = getNursesByDepartment(department);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5" />
            {department} Nurses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : departmentNurses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No nurses assigned to {department} yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Nurse No.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentNurses.map((nurse) => (
                  <TableRow key={nurse.id}>
                    <TableCell className="font-medium">{nurse.name}</TableCell>
                    <TableCell>{nurse.nurse_no}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEditNurse(nurse)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteNurse(nurse.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Nursing Staff</h1>
          <p className="text-muted-foreground">Directory of nurses by department</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Nurse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNurse ? "Edit" : "Add New"} Nurse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newNurse.name}
                  onChange={(e) => setNewNurse({ ...newNurse, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nurse_no">Nurse Number</Label>
                <Input
                  id="nurse_no"
                  value={newNurse.nurse_no}
                  onChange={(e) => setNewNurse({ ...newNurse, nurse_no: e.target.value })}
                  placeholder="e.g., N001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={newNurse.department}
                  onValueChange={(value) => setNewNurse({ ...newNurse, department: value as typeof newNurse.department })}
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
              <Button onClick={handleAddNurse} className="w-full">
                {editingNurse ? "Update" : "Add"} Nurse
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="WARD" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="WARD">WARD</TabsTrigger>
          <TabsTrigger value="OR">OR</TabsTrigger>
          <TabsTrigger value="ICU">ICU</TabsTrigger>
          <TabsTrigger value="ER">ER</TabsTrigger>
          <TabsTrigger value="HEMO">HEMO</TabsTrigger>
        </TabsList>

        <TabsContent value="WARD">
          <NurseTable department="WARD" />
        </TabsContent>

        <TabsContent value="OR">
          <NurseTable department="OR" />
        </TabsContent>

        <TabsContent value="ICU">
          <NurseTable department="ICU" />
        </TabsContent>

        <TabsContent value="ER">
          <NurseTable department="ER" />
        </TabsContent>

        <TabsContent value="HEMO">
          <NurseTable department="HEMO" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Nurses;
