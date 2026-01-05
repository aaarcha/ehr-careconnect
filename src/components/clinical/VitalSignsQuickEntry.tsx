import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Activity, Loader2, Plus } from "lucide-react";

interface VitalSignsQuickEntryProps {
  patientId: string;
  onSuccess: () => void;
}

export function VitalSignsQuickEntry({ patientId, onSuccess }: VitalSignsQuickEntryProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vitals, setVitals] = useState({
    blood_pressure: "",
    heart_rate: "",
    respiratory_rate: "",
    temperature: "",
    oxygen_saturation: "",
    pain_scale: "",
    notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate at least one vital sign is entered
    if (!vitals.blood_pressure && !vitals.heart_rate && !vitals.temperature) {
      toast.error("Please enter at least one vital sign (BP, HR, or Temp)");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("patient_vital_signs").insert({
        patient_id: patientId,
        blood_pressure: vitals.blood_pressure || null,
        heart_rate: vitals.heart_rate ? parseInt(vitals.heart_rate) : null,
        respiratory_rate: vitals.respiratory_rate ? parseInt(vitals.respiratory_rate) : null,
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
        oxygen_saturation: vitals.oxygen_saturation ? parseFloat(vitals.oxygen_saturation) : null,
        pain_scale: vitals.pain_scale ? parseInt(vitals.pain_scale) : null,
        notes: vitals.notes || null,
      });

      if (error) throw error;

      toast.success("Vital signs recorded successfully");
      setVitals({
        blood_pressure: "",
        heart_rate: "",
        respiratory_rate: "",
        temperature: "",
        oxygen_saturation: "",
        pain_scale: "",
        notes: "",
      });
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error saving vital signs:", error);
      toast.error(error.message || "Failed to save vital signs");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <Activity className="h-4 w-4" />
          Record Vitals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Quick Vital Signs Entry
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bp">Blood Pressure</Label>
            <Input
              id="bp"
              placeholder="120/80"
              value={vitals.blood_pressure}
              onChange={(e) => handleChange("blood_pressure", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hr">Heart Rate (bpm)</Label>
            <Input
              id="hr"
              type="number"
              placeholder="72"
              value={vitals.heart_rate}
              onChange={(e) => handleChange("heart_rate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rr">Respiratory Rate</Label>
            <Input
              id="rr"
              type="number"
              placeholder="16"
              value={vitals.respiratory_rate}
              onChange={(e) => handleChange("respiratory_rate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temp">Temperature (°C)</Label>
            <Input
              id="temp"
              type="number"
              step="0.1"
              placeholder="36.5"
              value={vitals.temperature}
              onChange={(e) => handleChange("temperature", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="o2">O₂ Saturation (%)</Label>
            <Input
              id="o2"
              type="number"
              placeholder="98"
              value={vitals.oxygen_saturation}
              onChange={(e) => handleChange("oxygen_saturation", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pain">Pain Scale (0-10)</Label>
            <Input
              id="pain"
              type="number"
              min="0"
              max="10"
              placeholder="0"
              value={vitals.pain_scale}
              onChange={(e) => handleChange("pain_scale", e.target.value)}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any observations or comments..."
              value={vitals.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Vital Signs
        </Button>
      </DialogContent>
    </Dialog>
  );
}
