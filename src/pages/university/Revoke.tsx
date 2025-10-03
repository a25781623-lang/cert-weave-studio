import { useState } from "react";
import UniversitySidebar from "@/components/UniversitySidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Search, XCircle } from "lucide-react";
import { Certificate } from "@/types/certificate";

const RevokeCertificate = () => {
  const [certificateId, setCertificateId] = useState("");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);

  const searchCertificate = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock certificate data
      if (certificateId) {
        setCertificate({
          id: certificateId,
          studentName: "John Doe",
          studentEmail: "john@example.com",
          courseName: "Computer Science Fundamentals",
          issueDate: "2024-01-02",
          grade: "A+",
          universityName: "Stanford University",
          walletAddress: "0x1234...5678",
          publicKey: "pub_key_123",
          signature: "sig_123",
          status: "active",
        });
      } else {
        toast({
          title: "Certificate Not Found",
          description: "Please enter a valid certificate ID",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 1000);
  };

  const handleRevoke = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Certificate Revoked",
        description: "The certificate has been successfully revoked",
      });
      setCertificate(null);
      setCertificateId("");
      setLoading(false);
    }, 1000);
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
              <CardTitle>Search Certificate</CardTitle>
              <CardDescription>Enter the certificate ID to revoke</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificateId">Certificate ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="certificateId"
                    placeholder="CERT-1704196800000"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={searchCertificate} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {certificate && (
            <>
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Certificate Details
                  </CardTitle>
                  <CardDescription>Review the certificate before revoking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Student Name</p>
                      <p className="font-medium">{certificate.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Student Email</p>
                      <p className="font-medium">{certificate.studentEmail}</p>
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
                        Revoking this certificate will permanently mark it as invalid. The student will no longer be able to verify this certificate.
                      </p>
                      <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
                        {loading ? "Revoking..." : "Revoke Certificate"}
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
