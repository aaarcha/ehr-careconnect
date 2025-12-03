import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Droplets } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sanitizeError } from "@/lib/errorHandling";

interface IORecord {
  id: string;
  patient_id: string;
  record_type: "intake" | "output";
  time: string;
  amount: number;
  type_description: string;
  notes: string | null;
  recorded_by: string | null;
}

interface IntakeOutputRecordProps {
  patientId: string;
  onUpdate?: () => void;
}

export const IntakeOutputRecord = ({ patientId, onUpdate }: IntakeOutputRecordProps) => {
  const [records, setRecords] = useState<IORecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IORecord | null>(null);
  
  const [formData, setFormData] = useState({
    record_type: "intake" as "intake" | "output",
    amount: "",
    type_description: "",
    notes: "",
    recorded_by: ""
  });

  useEffect(() => {
    fetchRecords();
  }, [patientId]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("intake_output_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("time", { ascending: false });

      if (error) throw error;
      setRecords((data || []) as IORecord[]);
    } catch (error) {
      toast.error(sanitizeError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.type_description) {
      toast.error("Amount and type are required");
      return;
    }

    try {
      if (editingRecord) {
        const { error } = await supabase
          .from("intake_output_records")
          .update({
            record_type: formData.record_type,
            amount: parseFloat(formData.amount),
            type_description: formData.type_description,
            notes: formData.notes || null,
            recorded_by: formData.recorded_by || null
          })
          .eq("id", editingRecord.id);

        if (error) throw error;
        toast.success("Record updated successfully");
      } else {
        const { error } = await supabase
          .from("intake_output_records")
          .insert({
            patient_id: patientId,
            record_type: formData.record_type,
            amount: parseFloat(formData.amount),
            type_description: formData.type_description,
            notes: formData.notes || null,
            recorded_by: formData.recorded_by || null
          });

        if (error) throw error;
        toast.success("Record added successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      onUpdate?.();
    } catch (error) {
      toast.error(sanitizeError(error));
    }
  };

  const handleEdit = (record: IORecord) => {
    setEditingRecord(record);
    setFormData({
      record_type: record.record_type,
      amount: record.amount.toString(),
      type_description: record.type_description,
      notes: record.notes || "",
      recorded_by: record.recorded_by || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("intake_output_records")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Record deleted successfully");
      fetchRecords();
      onUpdate?.();
    } catch (error) {
      toast.error(sanitizeError(error));
    }
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      record_type: "intake",
      amount: "",
      type_description: "",
      notes: "",
      recorded_by: ""
    });
  };

  const intakeRecords = records.filter(r => r.record_type === "intake");
  const outputRecords = records.filter(r => r.record_type === "output");
  const totalIntake = intakeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalOutput = outputRecords.reduce((sum, r) => sum + r.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Intake & Output Record
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Entry" : "Add Entry"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.record_type} onValueChange={(v: "intake" | "output") => setFormData({ ...formData, record_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intake">Intake</SelectItem>
                    <SelectItem value="output">Output</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (mL) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type_description">Description *</Label>
                  <Input
                    id="type_description"
                    value={formData.type_description}
                    onChange={(e) => setFormData({ ...formData, type_description: e.target.value })}
                    placeholder={formData.record_type === "intake" ? "e.g., Water, IV, Juice" : "e.g., Urine, Emesis"}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recorded_by">Recorded By</Label>
                <Input
                  id="recorded_by"
                  value={formData.recorded_by}
                  onChange={(e) => setFormData({ ...formData, recorded_by: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingRecord ? "Update" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Intake Table */}
            <div>
              <h3 className="font-semibold mb-2 text-green-600">Intake (Total: {totalIntake} mL)</h3>
              {intakeRecords.length === 0 ? (
                <p className="text-muted-foreground text-sm">No intake records.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {intakeRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{format(new Date(record.time), "h:mm a")}</TableCell>
                        <TableCell>{record.amount} mL</TableCell>
                        <TableCell>{record.type_description}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
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
                                  <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(record.id)}>Delete</AlertDialogAction>
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
            </div>

            {/* Output Table */}
            <div>
              <h3 className="font-semibold mb-2 text-amber-600">Output (Total: {totalOutput} mL)</h3>
              {outputRecords.length === 0 ? (
                <p className="text-muted-foreground text-sm">No output records.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outputRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{format(new Date(record.time), "h:mm a")}</TableCell>
                        <TableCell>{record.amount} mL</TableCell>
                        <TableCell>{record.type_description}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
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
                                  <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(record.id)}>Delete</AlertDialogAction>
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
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t flex justify-between font-semibold">
          <span>Balance: {totalIntake - totalOutput} mL</span>
        </div>
      </CardContent>
    </Card>
  );
};
