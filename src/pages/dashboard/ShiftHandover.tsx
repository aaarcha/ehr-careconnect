import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowRightLeft, Plus, Loader2, Check, Clock, AlertTriangle, Pill, ClipboardList } from "lucide-react";

interface Nurse {
  id: string;
  name: string;
  nurse_no: string;
  department: string;
}

interface ShiftHandover {
  id: string;
  outgoing_nurse_id: string | null;
  incoming_nurse_id: string | null;
  department: string;
  shift_date: string;
  shift_time: string;
  patient_summary: any;
  pending_tasks: string | null;
  critical_alerts: string | null;
  medications_due: string | null;
  general_notes: string | null;
  status: string | null;
  acknowledged_at: string | null;
  created_at: string;
  outgoing_nurse?: Nurse;
  incoming_nurse?: Nurse;
}

const SHIFT_TIMES = [
  { value: "AM", label: "Morning Shift (7 AM - 3 PM)" },
  { value: "PM", label: "Afternoon Shift (3 PM - 11 PM)" },
  { value: "NOC", label: "Night Shift (11 PM - 7 AM)" },
];

const DEPARTMENTS = [
  { value: "WARD", label: "Ward" },
  { value: "ICU", label: "ICU" },
  { value: "ER", label: "Emergency Room" },
  { value: "OR", label: "Operating Room" },
  { value: "OB", label: "OB-GYN" },
  { value: "PEDIA", label: "Pediatrics" },
];

export default function ShiftHandover() {
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [currentNurse, setCurrentNurse] = useState<Nurse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [newHandover, setNewHandover] = useState({
    department: "WARD",
    shift_time: "AM",
    incoming_nurse_id: "",
    pending_tasks: "",
    critical_alerts: "",
    medications_due: "",
    general_notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current nurse profile
      const { data: nurseData } = await supabase
        .from("nurses")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (nurseData) {
        setCurrentNurse(nurseData);
        setNewHandover(prev => ({ ...prev, department: nurseData.department }));
      }

      // Fetch all nurses for selection
      const { data: nursesData } = await supabase
        .from("nurses")
        .select("*")
        .order("name");

      setNurses(nursesData || []);

      // Fetch handovers
      const { data: handoversData } = await supabase
        .from("shift_handovers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Enrich with nurse names
      if (handoversData) {
        const enrichedHandovers = await Promise.all(
          handoversData.map(async (h) => {
            let outgoing_nurse, incoming_nurse;
            
            if (h.outgoing_nurse_id) {
              const { data } = await supabase
                .from("nurses")
                .select("*")
                .eq("id", h.outgoing_nurse_id)
                .single();
              outgoing_nurse = data;
            }
            
            if (h.incoming_nurse_id) {
              const { data } = await supabase
                .from("nurses")
                .select("*")
                .eq("id", h.incoming_nurse_id)
                .single();
              incoming_nurse = data;
            }

            return { ...h, outgoing_nurse, incoming_nurse };
          })
        );
        setHandovers(enrichedHandovers);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load shift handover data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHandover = async () => {
    if (!currentNurse) {
      toast.error("You must be logged in as a nurse to create a handover");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("shift_handovers").insert({
        outgoing_nurse_id: currentNurse.id,
        incoming_nurse_id: newHandover.incoming_nurse_id || null,
        department: newHandover.department,
        shift_time: newHandover.shift_time,
        pending_tasks: newHandover.pending_tasks,
        critical_alerts: newHandover.critical_alerts,
        medications_due: newHandover.medications_due,
        general_notes: newHandover.general_notes,
        patient_summary: [],
        status: "pending",
      });

      if (error) throw error;

      toast.success("Shift handover created successfully");
      setDialogOpen(false);
      setNewHandover({
        department: currentNurse.department,
        shift_time: "AM",
        incoming_nurse_id: "",
        pending_tasks: "",
        critical_alerts: "",
        medications_due: "",
        general_notes: "",
      });
      fetchData();
    } catch (error: any) {
      console.error("Error creating handover:", error);
      toast.error(error.message || "Failed to create shift handover");
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledge = async (handoverId: string) => {
    if (!currentNurse) {
      toast.error("You must be logged in as a nurse to acknowledge");
      return;
    }

    try {
      const { error } = await supabase
        .from("shift_handovers")
        .update({
          incoming_nurse_id: currentNurse.id,
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", handoverId);

      if (error) throw error;

      toast.success("Handover acknowledged");
      fetchData();
    } catch (error: any) {
      console.error("Error acknowledging handover:", error);
      toast.error(error.message || "Failed to acknowledge handover");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "acknowledged":
        return <Badge variant="default" className="bg-green-600"><Check className="h-3 w-3 mr-1" />Acknowledged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Shift Handover
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">Document and pass clinical notes to the incoming shift</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!currentNurse} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Handover
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Shift Handover</DialogTitle>
              <DialogDescription>
                Document important information for the incoming nurse
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={newHandover.department}
                    onValueChange={(v) => setNewHandover(prev => ({ ...prev, department: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Shift</Label>
                  <Select
                    value={newHandover.shift_time}
                    onValueChange={(v) => setNewHandover(prev => ({ ...prev, shift_time: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TIMES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Incoming Nurse (Optional)</Label>
                <Select
                  value={newHandover.incoming_nurse_id || "__none__"}
                  onValueChange={(v) => setNewHandover(prev => ({ ...prev, incoming_nurse_id: v === "__none__" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select incoming nurse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    {nurses.filter(n => n.id !== currentNurse?.id).map(n => (
                      <SelectItem key={n.id} value={n.id}>{n.name} ({n.nurse_no})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Critical Alerts
                </Label>
                <Textarea
                  placeholder="Any urgent patient concerns, unstable vitals, or immediate actions needed..."
                  value={newHandover.critical_alerts}
                  onChange={(e) => setNewHandover(prev => ({ ...prev, critical_alerts: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                  Pending Tasks
                </Label>
                <Textarea
                  placeholder="Tasks to be completed, pending orders, scheduled procedures..."
                  value={newHandover.pending_tasks}
                  onChange={(e) => setNewHandover(prev => ({ ...prev, pending_tasks: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-green-500" />
                  Medications Due
                </Label>
                <Textarea
                  placeholder="Upcoming medication administrations, IV changes, or drip adjustments..."
                  value={newHandover.medications_due}
                  onChange={(e) => setNewHandover(prev => ({ ...prev, medications_due: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>General Notes</Label>
                <Textarea
                  placeholder="Any other relevant information for the incoming shift..."
                  value={newHandover.general_notes}
                  onChange={(e) => setNewHandover(prev => ({ ...prev, general_notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateHandover} className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Handover Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!currentNurse && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <p className="text-yellow-800">You need to be logged in as a nurse to create or acknowledge handovers.</p>
          </CardContent>
        </Card>
      )}

      {/* Handover List */}
      <div className="space-y-4">
        {handovers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No shift handovers yet</p>
            </CardContent>
          </Card>
        ) : (
          handovers.map((handover) => (
            <Card key={handover.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {handover.outgoing_nurse?.name || "Unknown Nurse"}
                      <span className="text-muted-foreground font-normal">→</span>
                      {handover.incoming_nurse?.name || "Unassigned"}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(handover.created_at), "PPP 'at' p")} | {handover.department} - {SHIFT_TIMES.find(s => s.value === handover.shift_time)?.label || handover.shift_time}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(handover.status)}
                    {handover.status === "pending" && currentNurse && handover.outgoing_nurse_id !== currentNurse.id && (
                      <Button size="sm" onClick={() => handleAcknowledge(handover.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {handover.critical_alerts && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Critical Alerts
                    </p>
                    <p className="text-sm text-red-600 mt-1">{handover.critical_alerts}</p>
                  </div>
                )}

                {handover.pending_tasks && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                      <ClipboardList className="h-4 w-4" />
                      Pending Tasks
                    </p>
                    <p className="text-sm mt-1">{handover.pending_tasks}</p>
                  </div>
                )}

                {handover.medications_due && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                      <Pill className="h-4 w-4" />
                      Medications Due
                    </p>
                    <p className="text-sm mt-1">{handover.medications_due}</p>
                  </div>
                )}

                {handover.general_notes && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">General Notes</p>
                    <p className="text-sm mt-1">{handover.general_notes}</p>
                  </div>
                )}

                {handover.acknowledged_at && (
                  <p className="text-xs text-muted-foreground">
                    Acknowledged: {format(new Date(handover.acknowledged_at), "PPP 'at' p")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
