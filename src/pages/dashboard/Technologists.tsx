import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Microscope, Scan, Search, CheckCircle, XCircle } from "lucide-react";

interface MedTech {
  id: string;
  name: string;
  account_number: string;
  user_id: string | null;
}

interface RadTech {
  id: string;
  name: string;
  account_number: string;
  user_id: string | null;
}

const Technologists = () => {
  const [medtechs, setMedtechs] = useState<MedTech[]>([]);
  const [radtechs, setRadtechs] = useState<RadTech[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showMedtechDialog, setShowMedtechDialog] = useState(false);
  const [showRadtechDialog, setShowRadtechDialog] = useState(false);
  const [editingMedtech, setEditingMedtech] = useState<MedTech | null>(null);
  const [editingRadtech, setEditingRadtech] = useState<RadTech | null>(null);
  
  const [medtechForm, setMedtechForm] = useState({ name: "", account_number: "" });
  const [radtechForm, setRadtechForm] = useState({ name: "", account_number: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMedtechs(), fetchRadtechs(), fetchUserRole()]);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchMedtechs = async () => {
    const { data, error } = await supabase
      .from("medtechs")
      .select("id, name, account_number, user_id")
      .order("name");
    
    if (error) {
      toast.error("Error fetching medical technologists");
      return;
    }
    setMedtechs(data || []);
  };

  const fetchRadtechs = async () => {
    const { data, error } = await supabase
      .from("radtechs")
      .select("id, name, account_number, user_id")
      .order("name");
    
    if (error) {
      toast.error("Error fetching radiologic technologists");
      return;
    }
    setRadtechs(data || []);
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
        toast.success("Medical Technologist updated successfully");
      } else {
        const { error } = await supabase
          .from("medtechs")
          .insert([medtechForm]);
        
        if (error) throw error;
        toast.success("Medical Technologist added successfully");
      }
      
      setShowMedtechDialog(false);
      setMedtechForm({ name: "", account_number: "" });
      setEditingMedtech(null);
      fetchMedtechs();
    } catch (error: any) {
      toast.error(error.message);
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
        toast.success("Radiologic Technologist updated successfully");
      } else {
        const { error } = await supabase
          .from("radtechs")
          .insert([radtechForm]);
        
        if (error) throw error;
        toast.success("Radiologic Technologist added successfully");
      }
      
      setShowRadtechDialog(false);
      setRadtechForm({ name: "", account_number: "" });
      setEditingRadtech(null);
      fetchRadtechs();
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
    
    toast.success("Medical Technologist deleted");
    fetchMedtechs();
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
    
    toast.success("Radiologic Technologist deleted");
    fetchRadtechs();
  };

  const handleEditMedtech = (medtech: MedTech) => {
    setEditingMedtech(medtech);
    setMedtechForm({ name: medtech.name, account_number: medtech.account_number });
    setShowMedtechDialog(true);
  };

  const handleEditRadtech = (radtech: RadTech) => {
    setEditingRadtech(radtech);
    setRadtechForm({ name: radtech.name, account_number: radtech.account_number });
    setShowRadtechDialog(true);
  };

  const filteredMedtechs = medtechs.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.account_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRadtechs = radtechs.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.account_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isStaff = userRole === "staff";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Microscope className="h-8 w-8" />
            Technologist Directory
          </h1>
          <p className="text-muted-foreground">View and manage Medical Technology and Radiologic Technician staff</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Technologists</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search technologists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="medtech" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="medtech" className="flex items-center gap-2">
                <Microscope className="h-4 w-4" />
                Medical Technology ({filteredMedtechs.length})
              </TabsTrigger>
              <TabsTrigger value="radtech" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Radiologic Technicians ({filteredRadtechs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="medtech" className="mt-4">
              {isStaff && (
                <div className="mb-4">
                  <Dialog open={showMedtechDialog} onOpenChange={setShowMedtechDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingMedtech(null); setMedtechForm({ name: "", account_number: "" }); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medical Technologist
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingMedtech ? "Edit" : "Add"} Medical Technologist</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleMedtechSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={medtechForm.name}
                            onChange={(e) => setMedtechForm({ ...medtechForm, name: e.target.value })}
                            placeholder="Full name"
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
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowMedtechDialog(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button type="submit" className="flex-1">
                            {editingMedtech ? "Update" : "Add"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Account Status</TableHead>
                      {isStaff && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedtechs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isStaff ? 4 : 3} className="text-center text-muted-foreground py-8">
                          No medical technologists found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMedtechs.map((medtech) => (
                        <TableRow key={medtech.id}>
                          <TableCell className="font-medium">{medtech.name}</TableCell>
                          <TableCell>{medtech.account_number}</TableCell>
                          <TableCell>
                            {medtech.user_id ? (
                              <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Linked
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <XCircle className="h-3 w-3" />
                                Not Linked
                              </Badge>
                            )}
                          </TableCell>
                          {isStaff && (
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
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="radtech" className="mt-4">
              {isStaff && (
                <div className="mb-4">
                  <Dialog open={showRadtechDialog} onOpenChange={setShowRadtechDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingRadtech(null); setRadtechForm({ name: "", account_number: "" }); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Radiologic Technologist
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingRadtech ? "Edit" : "Add"} Radiologic Technologist</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRadtechSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={radtechForm.name}
                            onChange={(e) => setRadtechForm({ ...radtechForm, name: e.target.value })}
                            placeholder="Full name"
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
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowRadtechDialog(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button type="submit" className="flex-1">
                            {editingRadtech ? "Update" : "Add"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Account Status</TableHead>
                      {isStaff && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRadtechs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isStaff ? 4 : 3} className="text-center text-muted-foreground py-8">
                          No radiologic technologists found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRadtechs.map((radtech) => (
                        <TableRow key={radtech.id}>
                          <TableCell className="font-medium">{radtech.name}</TableCell>
                          <TableCell>{radtech.account_number}</TableCell>
                          <TableCell>
                            {radtech.user_id ? (
                              <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Linked
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <XCircle className="h-3 w-3" />
                                Not Linked
                              </Badge>
                            )}
                          </TableCell>
                          {isStaff && (
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
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Technologists;
