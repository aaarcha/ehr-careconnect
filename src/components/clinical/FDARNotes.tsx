import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sanitizeError } from "@/lib/errorHandling";

interface FDARNote {
  id: string;
  patient_id: string;
  date_time: string;
  focus: string;
  data: string | null;
  action: string | null;
  response: string | null;
  notes: string | null;
  nurse_name: string | null;
}

interface FDARNotesProps {
  patientId: string;
  onUpdate?: () => void;
}

export const FDARNotes = ({ patientId, onUpdate }: FDARNotesProps) => {
  const [notes, setNotes] = useState<FDARNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<FDARNote | null>(null);
  
  const [formData, setFormData] = useState({
    focus: "",
    data: "",
    action: "",
    response: "",
    notes: "",
    nurse_name: ""
  });

  useEffect(() => {
    fetchNotes();
  }, [patientId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("fdar_notes")
        .select("*")
        .eq("patient_id", patientId)
        .order("date_time", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      toast.error(sanitizeError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.focus) {
      toast.error("Focus is required");
      return;
    }

    try {
      if (editingNote) {
        const { error } = await supabase
          .from("fdar_notes")
          .update({
            focus: formData.focus,
            data: formData.data || null,
            action: formData.action || null,
            response: formData.response || null,
            notes: formData.notes || null,
            nurse_name: formData.nurse_name || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingNote.id);

        if (error) throw error;
        toast.success("Note updated successfully");
      } else {
        const { error } = await supabase
          .from("fdar_notes")
          .insert({
            patient_id: patientId,
            focus: formData.focus,
            data: formData.data || null,
            action: formData.action || null,
            response: formData.response || null,
            notes: formData.notes || null,
            nurse_name: formData.nurse_name || null
          });

        if (error) throw error;
        toast.success("Note added successfully");
      }

      setDialogOpen(false);
      setEditingNote(null);
      setFormData({ focus: "", data: "", action: "", response: "", notes: "", nurse_name: "" });
      fetchNotes();
      onUpdate?.();
    } catch (error) {
      toast.error(sanitizeError(error));
    }
  };

  const handleEdit = (note: FDARNote) => {
    setEditingNote(note);
    setFormData({
      focus: note.focus,
      data: note.data || "",
      action: note.action || "",
      response: note.response || "",
      notes: note.notes || "",
      nurse_name: note.nurse_name || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fdar_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Note deleted successfully");
      fetchNotes();
      onUpdate?.();
    } catch (error) {
      toast.error(sanitizeError(error));
    }
  };

  const resetForm = () => {
    setEditingNote(null);
    setFormData({ focus: "", data: "", action: "", response: "", notes: "", nurse_name: "" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Nurses Progress Notes (FDAR)
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit FDAR Note" : "Add FDAR Note"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="focus">Focus *</Label>
                  <Input
                    id="focus"
                    value={formData.focus}
                    onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                    placeholder="e.g., Pain Management"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nurse_name">Nurse Name</Label>
                  <Input
                    id="nurse_name"
                    value={formData.nurse_name}
                    onChange={(e) => setFormData({ ...formData, nurse_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data (D)</Label>
                <Textarea
                  id="data"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  placeholder="Subjective and objective data..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Action (A)</Label>
                <Textarea
                  id="action"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  placeholder="Nursing interventions..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response">Response (R)</Label>
                <Textarea
                  id="response"
                  value={formData.response}
                  onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                  placeholder="Patient response to interventions..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingNote ? "Update" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-muted-foreground">No progress notes recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Date & Time</TableHead>
                <TableHead>Focus</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">
                    {format(new Date(note.date_time), "MMM dd, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>{note.focus}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="space-y-1 text-sm">
                      {note.data && <p><span className="font-semibold">D:</span> {note.data}</p>}
                      {note.action && <p><span className="font-semibold">A:</span> {note.action}</p>}
                      {note.response && <p><span className="font-semibold">R:</span> {note.response}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(note)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(note.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
