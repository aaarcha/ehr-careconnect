import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoImage from "@/assets/CareConnectLogo.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Use existing staff account email
      const email = 'staff001@careconnect.com';

      // Try to sign in - if fails, update password via edge function
      let { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error?.message?.includes('Invalid login credentials')) {
        toast.info('Setting up staff account...');
        
        const { data, error: fnError } = await supabase.functions.invoke('reset-staff-password', {
          body: { email, password }
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        // Try login again
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (retryError) throw retryError;
        toast.success('Staff account ready!');
      } else if (error) {
        throw error;
      }

      navigate('/dashboard');
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-animated bg-[length:200%_200%] animate-gradient-shift">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-32 h-32 mb-4 rounded-full overflow-hidden">
            <img
              src={logoImage}
              alt="CareConnect Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">CareConnect</CardTitle>
          <CardDescription className="text-lg">
            Clinical Documentation Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Staff Account ID</Label>
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
