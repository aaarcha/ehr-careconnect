import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings as SettingsIcon, User, Bell, Database, Moon, Sun, Laptop, Loader2, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserManagement } from "@/components/dashboard/UserManagement";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    patientAlerts: true,
    systemUpdates: true,
  });
  
  // System preferences
  const [systemPrefs, setSystemPrefs] = useState({
    autoSave: true,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      setUserId(user.id);
      setProfileData(prev => ({
        ...prev,
        email: user.email || '',
      }));

      // Fetch user preferences from database
      const { data: prefs, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefs) {
        setNotifications({
          emailNotifications: prefs.email_notifications ?? true,
          patientAlerts: prefs.patient_alerts ?? true,
          systemUpdates: prefs.system_updates ?? true,
        });
        setSystemPrefs({
          autoSave: prefs.auto_save ?? true,
        });
      }

      // Try to get user's name from user_roles or auth metadata
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('account_number, role')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
        // Try to find the staff name based on role
        if (roleData.role === 'staff' && roleData.account_number) {
          setProfileData(prev => ({ ...prev, name: roleData.account_number }));
        } else if (roleData.role === 'doctor' && roleData.account_number) {
          const { data: doctor } = await supabase
            .from('doctors')
            .select('name')
            .eq('account_number', roleData.account_number)
            .single();
          if (doctor) {
            setProfileData(prev => ({ ...prev, name: doctor.name }));
          }
        } else if (roleData.role === 'medtech' && roleData.account_number) {
          const { data: medtech } = await supabase
            .from('medtechs')
            .select('name')
            .eq('account_number', roleData.account_number)
            .single();
          if (medtech) {
            setProfileData(prev => ({ ...prev, name: medtech.name }));
          }
        } else if (roleData.role === 'radtech' && roleData.account_number) {
          const { data: radtech } = await supabase
            .from('radtechs')
            .select('name')
            .eq('account_number', roleData.account_number)
            .single();
          if (radtech) {
            setProfileData(prev => ({ ...prev, name: radtech.name }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      toast.error("You must be logged in to update profile");
      return;
    }
    
    setSaving(true);
    try {
      // Get current user email to check if it changed
      const { data: { user } } = await supabase.auth.getUser();
      const currentEmail = user?.email;
      
      // Update email if changed
      if (profileData.email && profileData.email !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email,
        });
        if (emailError) throw emailError;
        
        // Email change requires confirmation
        toast.success("Confirmation email sent! Please check your new email inbox and click the confirmation link to complete the change.", {
          duration: 8000,
        });
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!userId) {
      toast.error("You must be logged in to save preferences");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          email_notifications: notifications.emailNotifications,
          patient_alerts: notifications.patientAlerts,
          system_updates: notifications.systemUpdates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      toast.success("Notification preferences saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    if (!userId) {
      toast.error("You must be logged in to save settings");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          auto_save: systemPrefs.autoSave,
          theme: theme,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      toast.success("System settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage system preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className={`grid w-full ${userRole === 'staff' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          {userRole === 'staff' && (
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-1" />
              Users
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Your name" 
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Name is managed by your administrator</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch 
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Patient Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about patient updates</p>
                </div>
                <Switch 
                  checked={notifications.patientAlerts}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, patientAlerts: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Updates</Label>
                  <p className="text-sm text-muted-foreground">Notifications about system changes</p>
                </div>
                <Switch 
                  checked={notifications.systemUpdates}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, systemUpdates: checked }))}
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>Configure system preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Laptop className="mr-2 h-4 w-4" />
                      <span>System</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch 
                  checked={systemPrefs.autoSave}
                  onCheckedChange={(checked) => setSystemPrefs(prev => ({ ...prev, autoSave: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input id="language" value="English" disabled />
              </div>
              <Button onClick={handleSaveSystemSettings} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab - Staff Only */}
        {userRole === 'staff' && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;