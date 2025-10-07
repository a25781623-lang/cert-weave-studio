import { useState, ChangeEvent } from "react";
import UniversitySidebar from "@/components/UniversitySidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Search, XCircle } from "lucide-react";
import { Certificate } from "@/types/certificate";
import { ethers } from "ethers";
import CertiChainAbi from "../../abis/CertiChain.json";
import { reconstructCertificateHash, CertificateData } from "@/lib/hash";

// Get the contract address from the .env file
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const RevokeCertificate = () => {
  const [certificateId, setCertificateId] = useState("");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setJsonFile(e.target.files[0]);
    }
  };

  const searchAndVerifyCertificate = async () => {
    if (!contractAddress) {
        toast({
            title: "Configuration Error",
            description: "The contract address is not configured in the application.",
            variant: "destructive",
        });
        return;
    }
      
    if (!certificateId.trim() || !jsonFile) {
      toast({
        title: "Missing Information",
        description: "Please provide both the Certificate ID and the JSON file.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setCertificate(null);

    try {
      const fileContent = await jsonFile.text();
      const jsonData: CertificateData = JSON.parse(fileContent);
      const reconstructedHash = reconstructCertificateHash(jsonData);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, CertiChainAbi, provider);

      const onChainCertificate = await contract.certificates(certificateId);

      if (onChainCertificate.universityAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("This Certificate ID does not exist on the blockchain.");
      }
      if (onChainCertificate.isRevoked) {
        throw new Error("This certificate has already been revoked.");
      }
      if (onChainCertificate.certificateHash !== reconstructedHash) {
        throw new Error("Hash mismatch. The JSON file does not correspond to the Certificate ID.");
      }

      toast({
        title: "Verification Successful",
        description: "Please review the certificate details before revoking.",
      });
      setCertificate({
        id: certificateId,
        studentName: jsonData.studentName,
        courseName: jsonData.courseName,
        issueDate: jsonData.issueDate,
        grade: jsonData.grade,
        status: "active",
        universityName: jsonData.universityName,
        studentEmail: "N/A", 
        walletAddress: jsonData.walletAddress,
        publicKey: "N/A",
        signature: "N/A",
      });

    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!contractAddress) {
        toast({
            title: "Configuration Error",
            description: "The contract address is not configured in the application.",
            variant: "destructive",
        });
        return;
    }
      
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CertiChainAbi, signer);

      const tx = await contract.revokeCertificate(certificateId);
      await tx.wait();

      toast({
        title: "Certificate Revoked",
        description: "The certificate has been successfully marked as revoked on the blockchain.",
      });
      
      setCertificate(null);
      setCertificateId("");
      setJsonFile(null);
      const fileInput = document.getElementById('jsonFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error("Error revoking certificate:", error);
      toast({
        title: "Revocation Error",
        description: error.message || "The transaction failed. Please check the console.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen bg-background">
      <UniversitySidebar />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Revoke Certificate</h1>
            <p className="text-muted-foreground">Revoke a previously issued certificate</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search & Verify Certificate</CardTitle>
              <CardDescription>Enter the ID and upload the JSON file to verify before revoking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificateId">Certificate ID</Label>
                <Input
                  id="certificateId"
                  placeholder="CERT-1704196800000"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="jsonFile">Certificate JSON File</Label>
                <div className="flex gap-2">
                  <Input id="jsonFile" type="file" onChange={handleFileChange} accept=".json" className="flex-1 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer" />
                  <Button onClick={searchAndVerifyCertificate} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    {loading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {certificate && (
            <>
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Confirm Certificate Details
                  </CardTitle>
                  <CardDescription>This data was loaded from your JSON file and verified against the blockchain.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Student Name</p>
                      <p className="font-medium">{certificate.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Course Name</p>
                      <p className="font-medium">{certificate.courseName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grade</p>
                      <p className="font-medium">{certificate.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="font-medium">{certificate.issueDate}</p>
                    </div>
                     <div>
                      <p className="text-sm text-muted-foreground">University</p>
                      <p className="font-medium">{certificate.universityName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{certificate.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-destructive/10 p-3 rounded-full">
                      <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">Warning: This action cannot be undone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Revoking this certificate will permanently mark it as invalid. This action will be recorded on the blockchain and cannot be reversed.
                      </p>
                      <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
                        {loading ? "Revoking..." : "Confirm and Revoke Certificate"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RevokeCertificate;