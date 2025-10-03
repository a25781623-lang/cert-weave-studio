import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Mail } from "lucide-react";

const UniversityRegister = () => {
  const [formData, setFormData] = useState({
    universityName: "",
    email: "",
    walletAddress: "",
    publicKey: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Simulate API call and email verification
    setTimeout(() => {
      setEmailSent(true);
      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your account",
      });
      setLoading(false);
    }, 1500);
  };

  const handleVerificationComplete = () => {
    toast({
      title: "Registration Successful",
      description: "Your account has been created",
    });
    navigate("/university/login");
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to complete your registration
            </p>
            <Button onClick={handleVerificationComplete} className="w-full">
              I've Verified My Email
            </Button>
          </CardContent>
          <CardFooter className="justify-center">
            <Link to="/university/login" className="text-sm text-primary hover:underline">
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 py-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Register University</CardTitle>
          <CardDescription>Create an account to issue blockchain certificates</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="universityName">University Name</Label>
                <Input
                  id="universityName"
                  name="universityName"
                  placeholder="e.g., Stanford University"
                  value={formData.universityName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="walletAddress">Wallet Address</Label>
              <Input
                id="walletAddress"
                name="walletAddress"
                placeholder="0x..."
                value={formData.walletAddress}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key</Label>
              <Input
                id="publicKey"
                name="publicKey"
                placeholder="Enter your public key"
                value={formData.publicKey}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link to="/university/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UniversityRegister;
