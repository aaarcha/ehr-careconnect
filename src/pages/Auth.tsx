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
  const [accountNumber, setAccountNumber] = useState("STAFF001");
  const [password, setPassword] = useState("staff123");
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

      // Staff login uses the seeded email
      const email = 'staff@careconnect.com';

      // Try to sign in first
      let { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // If user doesn't exist, create the account (for first-time setup)
      if (error?.message?.includes('Invalid login credentials')) {
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (signUpError) throw signUpError;

        // Create user_role entry for staff
        if (signUpData.user) {
          await supabase.from('user_roles').upsert({
            user_id: signUpData.user.id,
            role: 'staff',
            account_number: accountNumber
          }, { onConflict: 'user_id' });
        }

        toast.success('Account created! Logging in...');
        
        // Sign in after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (loginError) throw loginError;
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
