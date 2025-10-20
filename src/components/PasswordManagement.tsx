import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { KeyRound, RefreshCw } from "lucide-react";
import { sanitizeError } from "@/lib/errorHandling";

interface TechStaff {
  id: string;
  account_number: string;
  name: string;
  temp_password: string | null;
}

interface Patient {
  id: string;
  patient_number: string;
  name: string;
  temp_password: string | null;
}

export const PasswordManagement = () => {
  const [staffType, setStaffType] = useState<"medtech" | "radtech" | "patient">("medtech");
  const [staffList, setStaffList] = useState<TechStaff[] | Patient[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchStaffList();
  }, [staffType]);

  const fetchStaffList = async () => {
    try {
      if (staffType === "patient") {
        const { data, error } = await supabase
          .from("patients")
          .select("id, patient_number, name, temp_password")
          .order("name");

        if (error) throw error;
        setStaffList((data || []) as Patient[]);
      } else {
        const tableName = `${staffType}s` as "medtechs" | "radtechs";
        const { data, error } = await supabase
          .from(tableName)
          .select("id, account_number, name, temp_password")
          .order("name");

        if (error) throw error;
        setStaffList((data || []) as TechStaff[]);
      }
    } catch (error: any) {
      toast.error(sanitizeError(error));
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewPassword(password);
  };

  const assignPassword = async () => {
    if (!selectedId || !newPassword) {
      toast.error("Please select a staff member and enter a password");
      return;
    }

    try {
      if (staffType === "patient") {
        const { error } = await supabase
          .from("patients")
          .update({ temp_password: newPassword })
          .eq("id", selectedId);

        if (error) throw error;
      } else {
        const tableName = `${staffType}s` as "medtechs" | "radtechs";
        const { error } = await supabase
          .from(tableName)
          .update({ temp_password: newPassword })
          .eq("id", selectedId);

        if (error) throw error;
      }

      toast.success("Password assigned successfully");
      setNewPassword("");
      setSelectedId("");
      fetchStaffList();
    } catch (error: any) {
      toast.error(sanitizeError(error));
    }
  };

  const resetToOriginal = async (id: string, originalPassword: string) => {
    if (!originalPassword) {
      toast.error("No original password found");
      return;
    }

    try {
      if (staffType === "patient") {
        const { error } = await supabase
          .from("patients")
          .update({ temp_password: originalPassword })
          .eq("id", id);

        if (error) throw error;
      } else {
        const tableName = `${staffType}s` as "medtechs" | "radtechs";
        const { error } = await supabase
          .from(tableName)
          .update({ temp_password: originalPassword })
          .eq("id", id);

        if (error) throw error;
      }

      toast.success("Password reset to original");
      fetchStaffList();
    } catch (error: any) {
      toast.error(sanitizeError(error));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Password Management
          </CardTitle>
          <CardDescription>
            Assign temporary passwords for tech staff and patients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Staff Type</Label>
              <Select value={staffType} onValueChange={(value: any) => setStaffType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medtech">Medical Technologist</SelectItem>
                  <SelectItem value="radtech">Radiology Technologist</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Staff/Patient</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose..." />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {'account_number' in staff ? staff.account_number : (staff as Patient).patient_number} - {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password"
              />
              <Button variant="outline" onClick={generatePassword}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={assignPassword}>
            Assign Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current {staffType === "patient" ? "Patients" : `${staffType}s`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {staffType === "patient" ? "Patient Number" : "Account Number"}
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Password Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    {'account_number' in staff ? staff.account_number : (staff as Patient).patient_number}
                  </TableCell>
                  <TableCell>{staff.name}</TableCell>
                  <TableCell>
                    {staff.temp_password ? (
                      <span className="text-green-600">Assigned</span>
                    ) : (
                      <span className="text-amber-600">Not Set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {staff.temp_password && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetToOriginal(staff.id, staff.temp_password!)}
                      >
                        Reset
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
