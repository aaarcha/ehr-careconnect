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

const Auth = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("patient");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [patientNumber, setPatientNumber] = useState("");
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
      if (role === "patient") {
        // For patients: verify patient_number and temp_password
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("id, patient_number, temp_password, hospital_number")
          .eq("patient_number", patientNumber.trim())
          .maybeSingle();

        if (patientError || !patientData) {
          setFailedAttempts(prev => prev + 1);
          if (failedAttempts + 1 >= 5) {
            const lockoutDuration = Math.pow(2, failedAttempts - 3) * 60000;
            setLockoutUntil(new Date(Date.now() + lockoutDuration));
          }
          toast.error(`Invalid patient number or password. Attempt ${failedAttempts + 1} of 5.`);
          return;
        }

        // Verify temp password
        if (patientData.temp_password !== password) {
          setFailedAttempts(prev => prev + 1);
          if (failedAttempts + 1 >= 5) {
            const lockoutDuration = Math.pow(2, failedAttempts - 3) * 60000;
            setLockoutUntil(new Date(Date.now() + lockoutDuration));
          }
          toast.error(`Invalid patient number or password. Attempt ${failedAttempts + 1} of 5.`);
          return;
        }

        // Get user_id from user_roles
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("patient_number", patientData.patient_number)
          .eq("role", "patient")
          .maybeSingle();

        if (!roleData?.user_id) {
          toast.error("Patient account not properly configured. Contact staff.");
          return;
        }

        // Sign in with patient email pattern
        const patientEmail = `${patientData.patient_number}@patient.local`;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: patientEmail,
          password: password
        });

        if (signInError) {
          setFailedAttempts(prev => prev + 1);
          toast.error("Authentication failed. Contact staff if issue persists.");
          return;
        }

        setFailedAttempts(0);
        setLockoutUntil(null);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        // For staff, medtech, radtech
        if (role === "staff") {
          // Staff uses email/password
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: accountNumber.trim(),
            password: password
          });

          if (signInError) {
            setFailedAttempts(prev => prev + 1);
            if (failedAttempts + 1 >= 5) {
              const lockoutDuration = Math.pow(2, failedAttempts - 3) * 60000;
              setLockoutUntil(new Date(Date.now() + lockoutDuration));
            }
            toast.error(`Invalid email or password. Attempt ${failedAttempts + 1} of 5.`);
            return;
          }

          // Verify role
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", authData.session.user.id)
            .maybeSingle();

          if (!roleData || roleData.role !== "staff") {
            await supabase.auth.signOut();
            toast.error("Invalid account type");
            return;
          }
        } else {
          // MedTech or RadTech
          const tableName = role === "medtech" ? "medtechs" : "radtechs";
          const { data: techData, error: techError } = await supabase
            .from(tableName)
            .select("id, account_number, temp_password, user_id")
            .eq("account_number", accountNumber.trim())
            .maybeSingle();

          if (techError || !techData) {
            setFailedAttempts(prev => prev + 1);
            if (failedAttempts + 1 >= 5) {
              const lockoutDuration = Math.pow(2, failedAttempts - 3) * 60000;
              setLockoutUntil(new Date(Date.now() + lockoutDuration));
            }
            toast.error(`Invalid account number or password. Attempt ${failedAttempts + 1} of 5.`);
            return;
          }

          // Verify temp password
          if (techData.temp_password !== password) {
            setFailedAttempts(prev => prev + 1);
            if (failedAttempts + 1 >= 5) {
              const lockoutDuration = Math.pow(2, failedAttempts - 3) * 60000;
              setLockoutUntil(new Date(Date.now() + lockoutDuration));
            }
            toast.error(`Invalid account number or password. Attempt ${failedAttempts + 1} of 5.`);
            return;
          }

          if (!techData.user_id) {
            toast.error("Account not properly configured. Contact admin.");
            return;
          }

          // Sign in with tech email pattern
          const techEmail = `${techData.account_number}@${role}.local`;
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: techEmail,
            password: password
          });

          if (signInError) {
            setFailedAttempts(prev => prev + 1);
            toast.error("Authentication failed. Contact admin if issue persists.");
            return;
          }
        }

        setFailedAttempts(0);
        setLockoutUntil(null);
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
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
              <>
                <div className="space-y-2">
                  <Label htmlFor="patientNumber">Patient Number</Label>
                  <Input
                    id="patientNumber"
                    type="text"
                    placeholder="Enter patient number"
                    value={patientNumber}
                    onChange={(e) => setPatientNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientPassword">Password</Label>
                  <Input
                    id="patientPassword"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number / ID</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="e.g., STAFF001"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>
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
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground text-center space-y-1">
            <p className="font-semibold">Test Credentials:</p>
            <p>Staff: STAFF001 / staff123</p>
            <p>Patient: Use patient number + assigned password</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
