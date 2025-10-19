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
    setLoading(true);

    try {
      if (role === "patient") {
        // For patients, check if patient_number exists in patients table
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("id, patient_number, hospital_number")
          .eq("patient_number", patientNumber.trim())
          .maybeSingle();

        if (patientError || !patientData) {
          toast.error("Invalid patient number");
          setLoading(false);
          return;
        }

        // Find the user_id associated with this patient number
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("patient_number", patientNumber.trim())
          .eq("role", "patient")
          .maybeSingle();

        if (roleError || !roleData) {
          toast.error("Patient account not found");
          setLoading(false);
          return;
        }

        // Sign in with the patient email (no password required - auto-generated password)
        const patientEmail = `patient_${patientNumber.trim()}@careconnect.com`.toLowerCase();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: patientEmail,
          password: `patient_${patientNumber.trim()}_secure`,
        });

        if (signInError) {
          toast.error("Authentication failed");
          setLoading(false);
          return;
        }
      } else {
        // For staff, medtech, radtech - authenticate with account number and password
        const email = `${accountNumber.trim()}@careconnect.com`.toLowerCase();
        
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            toast.error("Invalid account number or password");
          } else if (signInError.message.includes("Email not confirmed")) {
            toast.error("Please confirm your email address");
          } else {
            toast.error(signInError.message);
          }
          setLoading(false);
          return;
        }

        // Validate the role after successful authentication
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role, account_number")
          .eq("user_id", authData.session.user.id)
          .single();

        if (roleError || !roleData || roleData.role !== role || roleData.account_number !== accountNumber.trim()) {
          await supabase.auth.signOut();
          toast.error("Invalid account number or role");
          setLoading(false);
          return;
        }
      }

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login");
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
                  placeholder="Enter patient number"
                  value={patientNumber}
                  onChange={(e) => setPatientNumber(e.target.value)}
                  required
                />
              </div>
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
            <p>Patient: Use your patient number</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
