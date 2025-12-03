import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Syringe } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sanitizeError } from "@/lib/errorHandling";

interface IVFluidRecord {
  id: string;
  patient_id: string;
  date: string;
  room_no: string | null;
  bottle_no: number | null;
  iv_solution: string;
  running_time: string | null;
  time_started: string | null;
  expected_time_to_consume: string | null;
  remarks: string | null;
}

interface IVFluidMonitoringProps {
  patientId: string;
  patientName: string;
  roomNo?: string;
  onUpdate?: () => void;
}

export const IVFluidMonitoring = ({ 
  patientId, 
  patientName,
  roomNo,
  onUpdate 
}: IVFluidMonitoringProps) => {
  const [records, setRecords] = useState<IVFluidRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IVFluidRecord | null>(null);
  
  const [formData, setFormData] = useState({
    bottle_no: "",
    iv_solution: "",
    running_time: "",
    time_started: "",
    expected_time_to_consume: "",
    remarks: ""
  });

  useEffect(() => {
    fetchRecords();
  }, [patientId]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("iv_fluid_monitoring")
        .select("*")
        .eq("patient_id", patientId)
        .order("date", { ascending: false });

      if (error) throw error;
      setRecords((data || []) as IVFluidRecord[]);
    } catch (error) {
      toast.error(sanitizeError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.iv_solution) {
      toast.error("IV Solution is required");
      return;
    }

    try {
      if (editingRecord) {
        const { error } = await supabase
          .from("iv_fluid_monitoring")
          .update({
            bottle_no: formData.bottle_no ? parseInt(formData.bottle_no) : null,
            iv_solution: formData.iv_solution,
            running_time: formData.running_time || null,
            time_started: formData.time_started ? new Date(formData.time_started).toISOString() : null,
            expected_time_to_consume: formData.expected_time_to_consume || null,
            remarks: formData.remarks || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingRecord.id);

        if (error) throw error;
        toast.success("Record updated successfully");
      } else {
        const { error } = await supabase
          .from("iv_fluid_monitoring")
          .insert({
            patient_id: patientId,
            room_no: roomNo || null,
            bottle_no: formData.bottle_no ? parseInt(formData.bottle_no) : null,
            iv_solution: formData.iv_solution,
            running_time: formData.running_time || null,
            time_started: formData.time_started ? new Date(formData.time_started).toISOString() : null,
            expected_time_to_consume: formData.expected_time_to_consume || null,
            remarks: formData.remarks || null
          });

        if (error) throw error;
        toast.success("IV fluid record added successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      onUpdate?.();
    } catch (error) {
      toast.error(sanitizeError(error));
    }
  };

  const handleEdit = (record: IVFluidRecord) => {
    setEditingRecord(record);
    setFormData({
      bottle_no: record.bottle_no?.toString() || "",
      iv_solution: record.iv_solution,
      running_time: record.running_time || "",
      time_started: record.time_started ? format(new Date(record.time_started), "yyyy-MM-dd'T'HH:mm") : "",
      expected_time_to_consume: record.expected_time_to_consume || "",
      remarks: record.remarks || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("iv_fluid_monitoring")
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
      bottle_no: "",
      iv_solution: "",
      running_time: "",
      time_started: "",
      expected_time_to_consume: "",
      remarks: ""
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Syringe className="h-5 w-5" />
          IV Fluid Monitoring
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add IV Fluid
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit IV Fluid" : "Add IV Fluid"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bottle_no">Bottle #</Label>
                  <Input
                    id="bottle_no"
                    type="number"
                    value={formData.bottle_no}
                    onChange={(e) => setFormData({ ...formData, bottle_no: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iv_solution">IV Solution *</Label>
                  <Input
                    id="iv_solution"
                    value={formData.iv_solution}
                    onChange={(e) => setFormData({ ...formData, iv_solution: e.target.value })}
                    placeholder="e.g., D5LR 1L"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="running_time">Running Time</Label>
                  <Input
                    id="running_time"
                    value={formData.running_time}
                    onChange={(e) => setFormData({ ...formData, running_time: e.target.value })}
                    placeholder="e.g., 8 hours"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time_started">Time Started</Label>
                  <Input
                    id="time_started"
                    type="datetime-local"
                    value={formData.time_started}
                    onChange={(e) => setFormData({ ...formData, time_started: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_time">Expected Time to Consume</Label>
                <Input
                  id="expected_time"
                  value={formData.expected_time_to_consume}
                  onChange={(e) => setFormData({ ...formData, expected_time_to_consume: e.target.value })}
                  placeholder="e.g., 8:00 PM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
        <div className="mb-4 grid grid-cols-3 gap-4 text-sm border-b pb-3">
          <div><span className="font-semibold">Patient:</span> {patientName}</div>
          <div><span className="font-semibold">Room #:</span> {roomNo || "N/A"}</div>
          <div><span className="font-semibold">Date:</span> {format(new Date(), "MMM dd, yyyy")}</div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-muted-foreground">No IV fluid records.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Bottle #</TableHead>
                <TableHead>IV Solution</TableHead>
                <TableHead>Running Time</TableHead>
                <TableHead>Time Started</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.date), "MMM dd")}</TableCell>
                  <TableCell>{record.bottle_no || "-"}</TableCell>
                  <TableCell className="font-medium">{record.iv_solution}</TableCell>
                  <TableCell>{record.running_time || "-"}</TableCell>
                  <TableCell>
                    {record.time_started ? format(new Date(record.time_started), "h:mm a") : "-"}
                  </TableCell>
                  <TableCell>{record.expected_time_to_consume || "-"}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{record.remarks || "-"}</TableCell>
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
                            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
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
      </CardContent>
    </Card>
  );
};
