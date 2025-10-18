import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Scan } from "lucide-react";

interface RadTech {
  id: string;
  name: string;
  account_number: string;
  created_at: string;
}

const RadTechs = () => {
  const [radtechs, setRadTechs] = useState<RadTech[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRadTech, setEditingRadTech] = useState<RadTech | null>(null);
  const [formData, setFormData] = useState({ name: "", account_number: "" });

  useEffect(() => {
    fetchRadTechs();
  }, []);

  const fetchRadTechs = async () => {
    const { data, error } = await supabase
      .from("radtechs")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Error fetching radiologic technologists");
      return;
    }
    setRadTechs(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRadTech) {
        const { error } = await supabase
          .from("radtechs")
          .update({ name: formData.name, account_number: formData.account_number })
          .eq("id", editingRadTech.id);
        
        if (error) throw error;
        toast.success("RadTech updated successfully");
      } else {
        const { error } = await supabase
          .from("radtechs")
          .insert([formData]);
        
        if (error) throw error;
        toast.success("RadTech added successfully");
      }
      
      setShowDialog(false);
      setFormData({ name: "", account_number: "" });
      setEditingRadTech(null);
      fetchRadTechs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
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

  const handleEdit = (radtech: RadTech) => {
    setEditingRadTech(radtech);
    setFormData({ name: radtech.name, account_number: radtech.account_number });
    setShowDialog(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Scan className="h-8 w-4" />
            Radiologic Technologists
          </h1>
          <p className="text-muted-foreground">Manage imaging technicians</p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setFormData({ name: "", account_number: "" });
            setEditingRadTech(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add RadTech
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRadTech ? "Edit" : "Add"} Radiologic Technologist</DialogTitle>
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
                  placeholder="e.g., RAD001"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingRadTech ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {radtechs.map((radtech) => (
          <Card key={radtech.id} className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{radtech.name}</span>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(radtech)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(radtech.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium">{radtech.account_number}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RadTechs;