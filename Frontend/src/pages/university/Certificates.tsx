import { useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { Certificate } from "@/types/certificate";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// This interface will hold the result from the backend verification
interface VerificationResult {
  valid: boolean;
  message: string;
}

const ViewCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  // Store verification results separately, mapping certificate ID to the result object
  const [verificationResults, setVerificationResults] = useState<Map<string, VerificationResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);

    const verificationPromises = Array.from(files).map(async (file) => {
      if (file.type !== "application/json") {
        toast({
          title: "Invalid File",
          description: `Skipping non-JSON file: ${file.name}`,
          variant: "destructive",
        });
        return null;
      }

      try {
        const fileContent = await file.text();
        const data = JSON.parse(fileContent);
        const certificateId = file.name.replace(".json", "");

        // Replicate the exact logic from Verify.tsx
        const rawQrData = [
          data.ipfsCid,
          data.studentName,
          data.universityName,
          data.courseName,
          data.issueDate,
          data.walletAddress,
          data.publicKey,
          certificateId,
          data.grade
        ].join('|');

        // Call the backend endpoint to perform the verification
        const response = await fetch('http://localhost:3000/verify-certificate-from-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qrData: rawQrData }),
        });

        const result: VerificationResult = await response.json();

        if (!response.ok) {
           // Use the message from the backend if available, otherwise a generic one
          throw new Error(result.message || 'Verification request failed');
        }

        const certificate: Certificate = { ...data, id: certificateId, status: result.valid ? 'active' : 'revoked' };
        
        return { certificate, result };

      } catch (error: any) {
        toast({
          title: "Verification Error",
          description: `Could not verify ${file.name}: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }
    });

    const results = await Promise.all(verificationPromises);
    const validResults = results.filter(r => r !== null);
    
    if (validResults.length > 0) {
      const newCertificates = validResults.map(r => r!.certificate);
      const newResultsMap = new Map(verificationResults);
      validResults.forEach(r => {
        newResultsMap.set(r!.certificate.id, r!.result);
      });

      setCertificates(prev => [...prev, ...newCertificates]);
      setVerificationResults(newResultsMap);
      
      toast({
        title: "Success",
        description: `Verified ${validResults.length} certificates.`,
      });
    }

    setIsLoading(false);
  };
  
  const clearData = () => {
    setCertificates([]);
    setVerificationResults(new Map());
    toast({
      title: "Cleared",
      description: "Certificate data has been cleared.",
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <UniversitySidebar />
      <main className="flex-1 p-8 ml-16">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Verify Certificates</h1>
            <p className="text-muted-foreground">Upload JSON files to verify their authenticity against the blockchain.</p>
          </div>

          {certificates.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload Certificates Data</CardTitle>
                <CardDescription>Upload one or more JSON files to verify and display.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-muted-foreground">Verifying certificates...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Button variant="outline" asChild>
                          <span>Choose JSON Files</span>
                        </Button>
                      </label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                        disabled={isLoading}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        The filename is used as the certificate ID.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Verification Results</CardTitle>
                  <CardDescription>Total certificates verified: {certificates.length}</CardDescription>
                </div>
                <div className="flex gap-2">
                    <label htmlFor="file-upload-more" className="cursor-pointer">
                        <Button variant="outline" asChild disabled={isLoading}>
                          <span>{isLoading ? "Verifying..." : "Upload More"}</span>
                        </Button>
                    </label>
                    <Input
                        id="file-upload-more"
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                        disabled={isLoading}
                    />
                    <Button
                      variant="destructive"
                      onClick={clearData}
                      disabled={isLoading}
                    >
                      Clear Data
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Student Name</TableHead>
                      <TableHead className="w-[150px]">Course</TableHead>
                      <TableHead className="w-[120px]">Issue Date</TableHead>
                      <TableHead className="w-[80px]">Grade</TableHead>
                      <TableHead className="w-[220px]">Certificate ID</TableHead>
                      <TableHead className="w-[200px] text-right">Verification Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => {
                      const result = verificationResults.get(cert.id);
                      return (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium truncate">{cert.studentName}</TableCell>
                          <TableCell className="truncate">{cert.courseName}</TableCell>
                          <TableCell>{cert.issueDate}</TableCell>
                          <TableCell>{cert.grade}</TableCell>
                          <TableCell className="font-mono text-xs truncate">{cert.id}</TableCell>
                          <TableCell className="text-right">
                            {result ? (
                              <Badge variant={result.valid ? "default" : "destructive"} className="whitespace-nowrap">
                                {result.message}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending...</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewCertificates;