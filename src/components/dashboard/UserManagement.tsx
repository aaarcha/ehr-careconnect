import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Users, Plus, Key, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ManagedUser {
  user_id: string;
  role: string;
  account_number: string;
  display_name: string;
  created_at: string;
}

interface Patient {
  id: string;
  name: string;
  hospital_number: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Admin/Staff' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'medtech', label: 'Laboratory Technician' },
  { value: 'radtech', label: 'Imaging Technician' },
  { value: 'patient', label: 'Patient' },
];

const SPECIALTIES = [
  "General Practice", "Internal Medicine", "Cardiology", "Neurology",
  "Orthopedics", "Pediatrics", "Obstetrics and Gynecology", "Dermatology",
  "Psychiatry", "Radiology", "Anesthesiology", "Emergency Medicine",
  "Family Medicine", "Gastroenterology", "Nephrology", "Pulmonology",
  "Oncology", "Urology", "Ophthalmology", "Otolaryngology"
];

export function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // Available patients and doctors for linking
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // New user form state
  const [newUser, setNewUser] = useState({
    role: 'staff' as string,
    name: '',
    accountNumber: '',
    password: '',
    linkedId: '',
    specialty: 'General Practice',
  });

  // Password reset form
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchPatientsAndDoctors();
  }, [filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('manage-users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
      });

      // The invoke method uses query params differently, so let's use the role filter client-side
      if (response.error) throw response.error;
      
      let userData = response.data?.users || [];
      if (filterRole !== 'all') {
        userData = userData.filter((u: ManagedUser) => u.role === filterRole);
      }
      
      setUsers(userData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientsAndDoctors = async () => {
    try {
      // Fetch patients without user_id for linking
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, name, hospital_number')
        .is('user_id', null)
        .order('name');
      
      setPatients(patientsData || []);

      // Fetch doctors without user_id for linking
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, name, specialty')
        .is('user_id', null)
        .order('name');
      
      setDoctors(doctorsData || []);
    } catch (error) {
      console.error('Error fetching patients/doctors:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.accountNumber || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newUser.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        method: 'POST',
        body: {
          role: newUser.role,
          name: newUser.name,
          accountNumber: newUser.accountNumber,
          password: newUser.password,
          linkedId: newUser.linkedId || undefined,
          specialty: newUser.role === 'doctor' ? newUser.specialty : undefined,
        },
      });

      if (response.error) throw response.error;

      toast.success('User created successfully');
      setDialogOpen(false);
      setNewUser({
        role: 'staff',
        name: '',
        accountNumber: '',
        password: '',
        linkedId: '',
        specialty: 'General Practice',
      });
      fetchUsers();
      fetchPatientsAndDoctors();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        method: 'POST',
        body: {
          role: selectedUser.role,
          name: selectedUser.display_name,
          accountNumber: selectedUser.account_number,
          password: newPassword,
        },
      });

      if (response.error) throw response.error;

      toast.success('Password reset successfully');
      setResetDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    if (!confirm(`Are you sure you want to delete user ${user.display_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('manage-users', {
        method: 'DELETE',
        body: { userId: user.user_id },
      });

      if (response.error) throw response.error;

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'staff': return 'default';
      case 'doctor': return 'secondary';
      case 'medtech': return 'outline';
      case 'radtech': return 'outline';
      case 'patient': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLE_OPTIONS.find(r => r.value === role)?.label || role;
  };

  // Generate account number based on role
  const generateAccountNumber = (role: string) => {
    const prefixes: Record<string, string> = {
      staff: 'STAFF',
      doctor: 'DOC',
      medtech: 'MT',
      radtech: 'RT',
      patient: 'PAT',
    };
    const prefix = prefixes[role] || 'USER';
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}${randomNum}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>Create and manage user accounts for all roles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter and Add User Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLE_OPTIONS.map(role => (
                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user account with login credentials
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => {
                      setNewUser(prev => ({ 
                        ...prev, 
                        role: value,
                        accountNumber: generateAccountNumber(value),
                        linkedId: ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Number (Login ID)</Label>
                  <Input 
                    value={newUser.accountNumber}
                    onChange={(e) => setNewUser(prev => ({ ...prev, accountNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g., STAFF001"
                  />
                  <p className="text-xs text-muted-foreground">
                    User will login with: {newUser.accountNumber.toLowerCase() || 'accountnumber'}@careconnect.com
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                {newUser.role === 'doctor' && (
                  <>
                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Select 
                        value={newUser.specialty} 
                        onValueChange={(value) => setNewUser(prev => ({ ...prev, specialty: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALTIES.map(spec => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {doctors.length > 0 && (
                      <div className="space-y-2">
                        <Label>Link to Existing Doctor (Optional)</Label>
                        <Select 
                          value={newUser.linkedId || "__new__"} 
                          onValueChange={(value) => setNewUser(prev => ({ ...prev, linkedId: value === "__new__" ? "" : value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select existing doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__new__">Create new record</SelectItem>
                            {doctors.map(doc => (
                              <SelectItem key={doc.id} value={doc.id}>
                                {doc.name} ({doc.specialty})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}

                {newUser.role === 'patient' && patients.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to Patient Record</Label>
                    <Select 
                      value={newUser.linkedId} 
                      onValueChange={(value) => setNewUser(prev => ({ ...prev, linkedId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient record" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(pat => (
                          <SelectItem key={pat.id} value={pat.id}>
                            {pat.name} ({pat.hospital_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={handleCreateUser} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell>{user.account_number}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setResetDialogOpen(true);
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Password Reset Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUser?.display_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <Button onClick={handleResetPassword} className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
