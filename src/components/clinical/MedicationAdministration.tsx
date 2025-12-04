import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Trash2, Pill, X, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sanitizeError } from "@/lib/errorHandling";

// Component for time checkbox with inline nurse initials input
const MARTimeCheckbox = ({
  time,
  given,
  nurse,
  disabled,
  onAdminister
}: {
  time: string;
  given: boolean;
  nurse: string;
  disabled: boolean;
  onAdminister: (given: boolean, initials: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initials, setInitials] = useState(nurse);

  const handleConfirm = () => {
    if (!initials.trim()) {
      toast.error("Please enter nurse initials");
      return;
    }
    onAdminister(true, initials);
    setIsOpen(false);
  };

  const handleUncheck = () => {
    onAdminister(false, "");
  };

  if (given) {
    return (
      <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-sm">
        <Check className="h-3 w-3 text-green-600" />
        <span className="font-medium">{time}</span>
        <span className="text-xs text-muted-foreground">({nurse})</span>
        {!disabled && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-1"
            onClick={handleUncheck}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="text-xs px-2 py-1 h-auto"
        >
          {time}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Mark as administered at {time}</div>
          <div className="space-y-2">
            <Label htmlFor="initials" className="text-xs">Nurse Initials</Label>
            <Input
              id="initials"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              placeholder="Enter initials"
              className="h-8"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm} className="flex-1">
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface MARRecord {
  id: string;
  patient_id: string;
  medication_name: string;
  dose: string;
  route: string;
  scheduled_times: string[];
  administered_times: { time: string; given: boolean; nurse: string }[];
  nurse_initials: string | null;
  is_completed: boolean;
  date: string;
  room_no: string | null;
}

interface MedicationAdministrationProps {
  patientId: string;
  patientName: string;
  patientDOB: string;
  roomNo?: string;
  onUpdate?: () => void;
}

export const MedicationAdministration = ({ 
  patientId, 
  patientName, 
  patientDOB,
  roomNo,
  onUpdate 
}: MedicationAdministrationProps) => {
  const [records, setRecords] = useState<MARRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MARRecord | null>(null);
  
  const [formData, setFormData] = useState({
    medication_name: "",
    dose: "",
    route: "",
    scheduled_times: ["08:00", "12:00", "18:00", "22:00"],
    nurse_initials: ""
  });

  useEffect(() => {
    fetchRecords();
  }, [patientId]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("medication_administration_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("date", { ascending: false });

      if (error) throw error;
      
      const mappedData = (data || []).map(record => ({
        ...record,
        scheduled_times: Array.isArray(record.scheduled_times) ? record.scheduled_times as string[] : [],
        administered_times: Array.isArray(record.administered_times) 
          ? (record.administered_times as unknown as { time: string; given: boolean; nurse: string }[])
          : []
      })) as unknown as MARRecord[];
      
      setRecords(mappedData);
    } catch (error) {
      toast.error(sanitizeError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.medication_name || !formData.dose || !formData.route) {
      toast.error("Medication name, dose, and route are required");
      return;
    }

    try {
      const administeredTimes = formData.scheduled_times.map(time => ({
        time,
        given: false,
        nurse: ""
      }));

      if (editingRecord) {
        const { error } = await supabase
          .from("medication_administration_records")
          .update({
            medication_name: formData.medication_name,
            dose: formData.dose,
            route: formData.route,
            scheduled_times: formData.scheduled_times,
            nurse_initials: formData.nurse_initials || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingRecord.id);

        if (error) throw error;
        toast.success("Record updated successfully");
      } else {
        const { error } = await supabase
          .from("medication_administration_records")
          .insert({
            patient_id: patientId,
            medication_name: formData.medication_name,
            dose: formData.dose,
            route: formData.route,
            scheduled_times: formData.scheduled_times,
            administered_times: administeredTimes,
            nurse_initials: formData.nurse_initials || null,
            room_no: roomNo || null,
            date: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;
        toast.success("Medication added successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      onUpdate?.();
    } catch (error) {
      toast.error(sanitizeError(error));
    }
  };

  const handleAdminister = async (recordId: string, timeIndex: number, given: boolean, nurseInitials: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const newAdministeredTimes = [...record.administered_times];
    newAdministeredTimes[timeIndex] = {
      ...newAdministeredTimes[timeIndex],
      given,
      nurse: nurseInitials
    };

    const allGiven = newAdministeredTimes.every(t => t.given);

    try {
      const { error } = await supabase
        .from("medication_administration_records")
        .update({
          administered_times: newAdministeredTimes,
          is_completed: allGiven,
          updated_at: new Date().toISOString()
        })
        .eq("id", recordId);

      if (error) throw error;
      fetchRecords();
    } catch (error) {
      toast.error(sanitizeError(error));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("medication_administration_records")
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
      medication_name: "",
      dose: "",
      route: "",
      scheduled_times: ["08:00", "12:00", "18:00", "22:00"],
      nurse_initials: ""
    });
  };

  const handleEdit = (record: MARRecord) => {
    setEditingRecord(record);
    setFormData({
      medication_name: record.medication_name,
      dose: record.dose,
      route: record.route,
      scheduled_times: record.scheduled_times,
      nurse_initials: record.nurse_initials || ""
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Medication Administration Record (MAR)
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Medication" : "Add Medication"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="medication_name">Medication Name *</Label>
                <Input
                  id="medication_name"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dose">Dose *</Label>
                  <Input
                    id="dose"
                    value={formData.dose}
                    onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route">Route *</Label>
                  <Input
                    id="route"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    placeholder="e.g., PO, IV, IM"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nurse_initials">Nurse Initials</Label>
                <Input
                  id="nurse_initials"
                  value={formData.nurse_initials}
                  onChange={(e) => setFormData({ ...formData, nurse_initials: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Scheduled Times</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.scheduled_times.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...formData.scheduled_times];
                          newTimes[idx] = e.target.value;
                          setFormData({ ...formData, scheduled_times: newTimes });
                        }}
                        className="w-28"
                      />
                      {formData.scheduled_times.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const newTimes = formData.scheduled_times.filter((_, i) => i !== idx);
                            setFormData({ ...formData, scheduled_times: newTimes });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, scheduled_times: [...formData.scheduled_times, "12:00"] })}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Time
                  </Button>
                </div>
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
        <div className="mb-4 grid grid-cols-4 gap-4 text-sm border-b pb-3">
          <div><span className="font-semibold">Patient:</span> {patientName}</div>
          <div><span className="font-semibold">DOB:</span> {format(new Date(patientDOB), "MMM dd, yyyy")}</div>
          <div><span className="font-semibold">Room No:</span> {roomNo || "N/A"}</div>
          <div><span className="font-semibold">Date:</span> {format(new Date(), "MMM dd, yyyy")}</div>
        </div>
        
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-muted-foreground">No medications recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Times</TableHead>
                <TableHead>Nurse</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className={record.is_completed ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{record.medication_name}</TableCell>
                  <TableCell>{record.dose}</TableCell>
                  <TableCell>{record.route}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {record.scheduled_times.map((time, idx) => (
                        <MARTimeCheckbox
                          key={idx}
                          time={time}
                          given={record.administered_times[idx]?.given || false}
                          nurse={record.administered_times[idx]?.nurse || ""}
                          disabled={record.is_completed}
                          onAdminister={(given, initials) => handleAdminister(record.id, idx, given, initials)}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{record.nurse_initials || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(record)}
                        disabled={record.is_completed}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={record.is_completed}>
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
