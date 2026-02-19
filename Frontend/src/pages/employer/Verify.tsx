// src/pages/employer/Verify.tsx (Updated)

import { useState } from "react";
import { useNavigate, Link} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Search, GraduationCap } from "lucide-react"; 
import { useToast } from "@/components/ui/use-toast";

import { CertificateData } from "@/lib/hash"; 



const EmployerVerify = () => {
  const [certificateId, setCertificateId] = useState("");
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/json'|| file.type === 'text/plain')) {
      setJsonFile(file);
    } else {
      setJsonFile(null);
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a valid .json file.',
      });
    }
  };

  // --- THIS IS THE UPDATED LOGIC BASED ON YOUR IDEA ---
  const handleVerify = async () => {
    if (!certificateId.trim() || !jsonFile) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a Certificate ID and upload the certificate JSON file.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const fileContent = await jsonFile.text();
      const data: CertificateData = JSON.parse(fileContent);

      // 1. Construct the pipe-separated data string in the correct order
      const rawQrData = [
        data.ipfsCid,
        data.studentName,
        data.universityName,
        data.courseName,
        data.issueDate,
        data.walletAddress,
        data.publicKey,
        certificateId, // Use the ID from the input field
        data.grade
      ].join('|');

      // 2. Navigate to the existing, working result URL with the data
      navigate(`/verify/result?qrData=${encodeURIComponent(rawQrData)}`);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message || 'Could not process the JSON file.',
      });
      setIsLoading(false);
    }
  };

  return (
    // Your JSX remains exactly the same
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Certificate Verification</h1>
              <p className="text-xs text-muted-foreground">Employer Portal</p>
            </div>
          </div>
          <Link to="/university/login">
            <Button variant="outline" size="sm" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              University Portal
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-4xl font-bold text-foreground">Verify Certificate</h2>
            <p className="text-lg text-muted-foreground">
              Enter the Certificate ID and upload the data file to verify authenticity
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Certificate Verification</CardTitle>
              <CardDescription>
                Verify the authenticity and validity of blockchain certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="certId">Certificate ID</Label>
                <Input
                  id="certId"
                  placeholder="e.g., CERT-1672532..."
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certFile">Certificate Data File (.json)</Label>
                <div className="flex gap-2">
                  <Input
                    id="certFile"
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileChange}
                    className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  <Button onClick={handleVerify} disabled={isLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-3">How Verification Works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>The student provides their Certificate ID and the .json data file they received via email.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>The hash is reconstructed from the file and compared against the one stored on the blockchain.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Verification happens in real-time against the blockchain.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Revoked certificates are immediately flagged in the system.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EmployerVerify;