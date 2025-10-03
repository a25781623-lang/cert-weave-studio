import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Mail, Wallet } from "lucide-react";
import axios from "axios";
import { ethers } from "ethers";

const isMetaMaskInstalled = () => {
  const { ethereum } = window as any;
  return Boolean(ethereum && ethereum.isMetaMask);
};

const UniversityRegister = () => {
  const [formData, setFormData] = useState({
    universityName: "",
    email: "",
    walletAddress: "",
    publicKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast({ title: "MetaMask not found", description: "Please install the MetaMask extension.", variant: "destructive" });
      return;
    }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setFormData(prev => ({ ...prev, walletAddress: accounts[0] }));
      toast({ title: "Wallet Connected", description: `Address: ${accounts[0]}` });
    } catch (error) {
      toast({ title: "Failed to connect wallet", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/register', formData);
      setEmailSent(true);
      toast({
        title: "Verification Email Sent",
        description: "Please check your backend terminal for the Ethereal preview link.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "An unknown error occurred. Is the backend server running?",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Check Your Test Inbox</CardTitle>
            <CardDescription>We've sent a verification link to a temporary inbox.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your **backend terminal**. A preview link for the email has been printed there. Click that link to continue.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Link to="/university/login" className="text-sm text-primary hover:underline">Back to Login</Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 py-8">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-3 text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Register University</CardTitle>
            <CardDescription>Step 1: Provide your university's blockchain details.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="universityName">University Name</Label>
                <Input id="universityName" name="universityName" placeholder="e.g., IIT Delhi" value={formData.universityName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Official Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="registrar@iitd.ac.in" value={formData.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="walletAddress">University Wallet Address</Label>
              <div className="flex gap-2">
                <Input id="walletAddress" name="walletAddress" placeholder="0x... or connect wallet" value={formData.walletAddress} onChange={handleChange} required />
                <Button type="button" variant="outline" onClick={connectWallet} className="gap-2">
                  <Wallet className="h-4 w-4" /> Connect
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key</Label>
              <Input id="publicKey" name="publicKey" placeholder="Enter your public key" value={formData.publicKey} onChange={handleChange} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying Details..." : "Send Verification Email"}
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