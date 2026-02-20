import { useState } from "react";
import { Link } from "react-router-dom";
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
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Mail, Wallet, FileUp ,AlertTriangle,ExternalLink} from "lucide-react";
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
  const [fileName, setFileName] = useState("");
  const [showMetaMaskGuide, setShowMetaMaskGuide] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFormData({ ...formData, publicKey: content });
        setFileName(file.name);
        toast({
          title: "File Uploaded",
          description: `${file.name} has been selected.`,
        });
      };
      reader.readAsText(file);
    }
  };

  const connectWallet = async () => {
      if (!isMetaMaskInstalled()) {
        setShowMetaMaskGuide(true);
        return;
      }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const checksumAddress = ethers.getAddress(accounts[0]);

      // --- Use the corrected, checksummed address ---
      setFormData((prev) => ({ ...prev, walletAddress: checksumAddress }));
      toast({
        title: "Wallet Connected",
        description: `Address: ${accounts[0]}`,
      });
    } catch (_error) {
      toast({ title: "Failed to connect wallet", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/register`, formData);
      
      setEmailSent(true);
      toast({
        title: "Verification Email Sent",
        description:
          "Please check your backend terminal for the Ethereal preview link.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description:
          error.response?.data?.message ||
          "An unknown error occurred. Is the backend server running?",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
 // --- MetaMask Setup Guide Card ---
  if (showMetaMaskGuide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-lg shadow-lg border-orange-200">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">No Wallet Detected</CardTitle>
            <CardDescription>
              Follow these steps to set up your MetaMask wallet and connect to
              MegaETH Testnet before registering.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <ol className="space-y-4 text-sm text-foreground">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>
                  <strong>Install MetaMask</strong> from the{" "}
                  <a
                    href="https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Chrome Web Store <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Safari's App Store <ExternalLink className="h-3 w-3" />
                  </a>
                  .
                </span>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>
                  <strong>Set up your Wallet</strong> by following the MetaMask
                  onboarding instructions to create or import an account.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>
                  Under the <strong>Token, DeFi, NFTs</strong> section, click
                  the box that says <strong>Ethereum</strong>. In the{" "}
                  <em>Select Network</em> pop-up, go to{" "}
                  <strong>Custom</strong> and select{" "}
                  <strong>MegaETH Testnet</strong>.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>
                  <strong>Copy your wallet address</strong>, then go to{" "}
                  <a
                    href="https://testnet.megaeth.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    testnet.megaeth.com <ExternalLink className="h-3 w-3" />
                  </a>
                  , click on <strong>Faucet</strong>, paste your wallet address,
                  and claim some test ETH.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <span>
                  Once done, come back and{" "}
                  <strong>try to Register again</strong>!
                </span>
              </li>
            </ol>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={() => {
                setShowMetaMaskGuide(false);
              }}
            >
              I've Installed MetaMask — Try Again
            </Button>
            <Link
              to="/university/login"
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }



  if (emailSent) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-2xl">Check Your Inbox</CardTitle>
          <CardDescription>
            We've sent a verification link to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Please check your Inbox and click that link to continue.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-left space-y-1">
            <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
              ⚠ Demonstration Mode
            </p>
            <p className="text-xs text-yellow-700">
              For this demo, email whitelisting is <strong>not enforced</strong>.
              In a real-world deployment, the backend is configured to validate
              the submitted email against{" "}
              <strong>UGC's official university records</strong>, ensuring only
              recognized institutions with verified email domains can register.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            to="/university/login"
            className="text-sm text-primary hover:underline"
          >
            Back to Login
          </Link>
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
          <CardDescription>
            Step 1: Provide your university's blockchain details.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="universityName">University Name</Label>
                <Input
                  id="universityName"
                  name="universityName"
                  placeholder="e.g., IIT Delhi"
                  value={formData.universityName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Official Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="registrar@iitd.ac.in"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="walletAddress">University Wallet Address</Label>
              <div className="flex gap-2">
                <Input
                  id="walletAddress"
                  name="walletAddress"
                  placeholder="0x... or connect wallet"
                  value={formData.walletAddress}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={connectWallet}
                  className="gap-2"
                >
                  <Wallet className="h-4 w-4" /> Connect
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key</Label>
              <div className="flex gap-2">
                <Input
                  id="publicKey"
                  name="publicKey"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden" // Hide the default file input
                />
                <Label
                  htmlFor="publicKey"
                  className="flex items-center gap-2 cursor-pointer w-full border rounded-md p-2 hover:bg-accent"
                >
                  <FileUp className="h-4 w-4" />
                  <span>{fileName || "Upload .pem file"}</span>
                </Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying Details..." : "Send Verification Email"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link
                to="/university/login"
                className="text-primary hover:underline font-medium"
              >
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