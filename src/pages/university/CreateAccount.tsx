import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import axios from "axios";
import { ethers } from "ethers";

// Helper to check if MetaMask is installed
const isMetaMaskInstalled = () => {
  const { ethereum } = window as any;
  return Boolean(ethereum && ethereum.isMetaMask);
};

const CreateAccount = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (!isMetaMaskInstalled()) {
      toast({
        title: "MetaMask not found",
        description: "Please install the MetaMask extension to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Get the current wallet address from MetaMask
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Step 2: Prepare the transaction by calling the backend
      const prepareResponse = await axios.post(
        "http://localhost:3000/prepare-registration",
        { token, walletAddress }
      );
      const { unsignedTx } = prepareResponse.data;

      // Step 3: Ask the user to sign and send the transaction via MetaMask
      toast({
        title:
          "Please confirm the transaction in MetaMask to register your university on-chain.",
      });
      const tx = await signer.sendTransaction(unsignedTx);
      const receipt = await tx.wait(); // Wait for the transaction to be mined

      if (!receipt || !receipt.hash) {
        throw new Error("Transaction failed or hash not found.");
      }

      // Step 4: Finalize the registration with the transaction hash
      await axios.post("http://localhost:3000/finalize-registration", {
        token,
        password,
        txHash: receipt.hash,
      });

      toast({
        title: "Account Created Successfully!",
        description: "Please read the important next step.",
      });
      setShowSuccessDialog(true); // Show the success dialog
    } catch (error: any) {
      console.error("Registration Error:", error);
      toast({
        title: "Account Creation Failed",
        description:
          error.response?.data?.message ||
          "An error occurred. The link may have expired or the transaction was rejected.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Finalize Your Account</CardTitle>
            <CardDescription>
              Your email is verified. Set a password and confirm the transaction
              to complete registration.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
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
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : "Complete Registration & Sign"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Important Next Step</AlertDialogTitle>
            <AlertDialogDescription>
              To issue and sign certificates, you need our local signing
              application. Have you installed CertificateSignerSetup\_v1.0.0? If
              not, please download it from the homepage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/university/login")}>
              Okay, take me to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateAccount;