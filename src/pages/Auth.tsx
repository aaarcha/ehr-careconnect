import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoImage from "@/assets/CareConnectLogo.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  useEffect(() => {
    // Check if we're in password reset mode from URL params or hash
    const mode = searchParams.get('mode');
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (mode === 'reset' || type === 'recovery') {
      setIsResetMode(true);
    }

    // Listen for auth state changes (handles recovery flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetMode(true);
      } else if (event === 'SIGNED_IN' && !isResetMode) {
        navigate("/dashboard");
      }
    });

    // Check existing session (only if not in reset mode)
    if (!isResetMode) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && !isResetMode) {
          navigate("/dashboard");
        }
      });
    }

    return () => subscription.unsubscribe();
  }, [navigate, searchParams, isResetMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountNumber.trim()) {
      toast.error('Please enter your Staff Account ID');
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    
    try {
      setLoading(true);

      // Generate email from account number (e.g., STAFF001 -> staff001@careconnect.com)
      const email = `${accountNumber.toLowerCase().trim()}@careconnect.com`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Provide user-friendly error messages without exposing internal details
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('Invalid account ID or password');
        } else {
          toast.error('Login failed. Please try again.');
        }
        return;
      }

      navigate('/dashboard');
      
    } catch (error: any) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Please enter your new password');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast.error(error.message || 'Failed to update password');
        return;
      }

      toast.success('Password updated successfully! Redirecting...');
      setIsResetMode(false);
      
      // Clear URL params
      window.history.replaceState({}, document.title, '/auth');
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      setPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password Reset Form
  if (isResetMode) {
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
            <CardTitle className="text-3xl font-bold text-primary">Set New Password</CardTitle>
            <CardDescription className="text-lg">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login Form
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
