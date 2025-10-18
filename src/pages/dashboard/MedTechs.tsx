import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, TestTube } from "lucide-react";

interface MedTech {
  id: string;
  name: string;
  account_number: string;
  created_at: string;
}

const MedTechs = () => {
  const [medtechs, setMedTechs] = useState<MedTech[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMedTech, setEditingMedTech] = useState<MedTech | null>(null);
  const [formData, setFormData] = useState({ name: "", account_number: "" });

  useEffect(() => {
    fetchMedTechs();
  }, []);

  const fetchMedTechs = async () => {
    const { data, error } = await supabase
      .from("medtechs")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Error fetching medical technologists");
      return;
    }
    setMedTechs(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMedTech) {
        const { error } = await supabase
          .from("medtechs")
          .update({ name: formData.name, account_number: formData.account_number })
          .eq("id", editingMedTech.id);
        
        if (error) throw error;
        toast.success("MedTech updated successfully");
      } else {
        const { error } = await supabase
          .from("medtechs")
          .insert([formData]);
        
        if (error) throw error;
        toast.success("MedTech added successfully");
      }
      
      setShowDialog(false);
      setFormData({ name: "", account_number: "" });
      setEditingMedTech(null);
      fetchMedTechs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
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

  const handleEdit = (medtech: MedTech) => {
    setEditingMedTech(medtech);
    setFormData({ name: medtech.name, account_number: medtech.account_number });
    setShowDialog(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            Medical Technologists
          </h1>
          <p className="text-muted-foreground">Manage laboratory technicians</p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setFormData({ name: "", account_number: "" });
            setEditingMedTech(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add MedTech
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMedTech ? "Edit" : "Add"} Medical Technologist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="e.g., MED001"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingMedTech ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {medtechs.map((medtech) => (
          <Card key={medtech.id} className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{medtech.name}</span>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(medtech)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(medtech.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium">{medtech.account_number}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MedTechs;