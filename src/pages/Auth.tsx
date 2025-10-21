import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoImage from "@/assets/CareConnectLogo.jpg";

type UserRole = "staff" | "medtech" | "radtech" | "patient";

// Helper function to map Account/Patient ID to the seeded email
const getEmailFromIdAndRole = (id: string, role: UserRole): string | undefined => {
  const accountId = id.trim().toUpperCase();
  switch (role) {
    case "staff":
      // Check for the specific seeded staff ID
      return accountId === "STAFF001" ? "staff@careconnect.com" : undefined;
    case "medtech":
      // Check for the specific seeded medtech ID
      return accountId === "MTECH001" ? "medtech@careconnect.com" : undefined;
    case "radtech":
      // Check for the specific seeded radtech ID
      return accountId === "RTECH001" ? "radtech@careconnect.com" : undefined;
    case "patient":
      // Check for the specific seeded patient ID
      return accountId === "P0000001" ? "patient@careconnect.com" : undefined;
    default:
      return undefined;
  }
};

const Auth = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("patient");
  const [accountNumber, setAccountNumber] = useState("");
  const [patientNumber, setPatientNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Rate limiting state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check lockout status
    if (lockoutUntil && new Date() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil.getTime() - new Date().getTime()) / 1000);
      toast.error(`Account locked. Try again in ${remainingSeconds} seconds.`);
      return;
    }

    if (!password) {
      toast.error("Password is required");
      return;
    }

    setLoading(true);

    try {
      let loginId = role === "patient" ? patientNumber : accountNumber;
      let emailToAuth = getEmailFromIdAndRole(loginId, role);

      if (!emailToAuth) {
        setFailedAttempts(prev => prev + 1);
        toast.error(`Invalid login ID or role selected. Attempt ${failedAttempts + 1} of 5.`);
        setLoading(false);
        return;
      }

      // 1. Attempt standard email/password authentication via Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: password
      });

      if (signInError) {
        setFailedAttempts(prev => prev + 1);
        if (failedAttempts + 1 >= 5) {
          const lockoutDuration = Math.pow(2, failedAttempts - 3) * 60000;
          setLockoutUntil(new Date(Date.now() + lockoutDuration));
        }
        toast.error(`Invalid ID or password. Attempt ${failedAttempts + 1} of 5.`);
        setLoading(false);
        return;
      }

      // 2. Security Check: Verify the authenticated user's role against the selected role.
      // This prevents a user who belongs to multiple roles from logging in with the wrong role selected.
      const userId = authData?.user?.id;
      if (!userId) {
        await supabase.auth.signOut();
        toast.error("Authentication error: User ID not found.");
        setLoading(false);
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", role) // Check if the user has the selected role
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        toast.error(`Login error: Account is not configured as a ${role}.`);
        setLoading(false);
        return;
      }

      // Success
      setFailedAttempts(0);
      setLockoutUntil(null);
      toast.success(`Login successful as ${role}!`);
      navigate("/dashboard");

    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-animated bg-[length:200%_200%] animate-gradient-shift">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-32 h-32 mb-4">
            <img
              src={logoImage}
              alt="CareConnect Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">CareConnect</CardTitle>
          <CardDescription className="text-lg">
            Empowering Seamless Care, Connecting Lives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <Label>Select Role</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="staff" id="staff" />
                  <Label htmlFor="staff" className="cursor-pointer">Staff</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medtech" id="medtech" />
                  <Label htmlFor="medtech" className="cursor-pointer">MedTech</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="radtech" id="radtech" />
                  <Label htmlFor="radtech" className="cursor-pointer">RadTech</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label htmlFor="patient" className="cursor-pointer">Patient</Label>
                </div>
              </RadioGroup>
            </div>

            {role === "patient" ? (
              <div className="space-y-2">
                <Label htmlFor="patientNumber">Patient Number</Label>
                <Input
                  id="patientNumber"
                  type="text"
                  placeholder="e.g., P0000001"
                  value={patientNumber}
                  onChange={(e) => setPatientNumber(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number / ID</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="e.g., STAFF001, MTECH001, RTECH001"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;