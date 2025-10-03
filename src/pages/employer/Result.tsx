import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Certificate } from "@/types/certificate";

const VerificationResult = () => {
  const { certificateId } = useParams();

  // Mock certificate data - in real app, this would come from API
  const mockCertificate: Certificate = {
    id: certificateId || "",
    studentName: "John Doe",
    studentEmail: "john@example.com",
    courseName: "Computer Science Fundamentals",
    issueDate: "2024-01-02",
    grade: "A+",
    universityName: "Stanford University",
    walletAddress: "0x1234...5678",
    publicKey: "pub_key_123",
    signature: "0x9876543210abcdef...",
    status: "active",
  };

  // Simulate verification status
  const isValid = mockCertificate.status === "active";
  const isRevoked = mockCertificate.status === "revoked";
  const notFound = !certificateId || certificateId.length < 10;

  const getStatusInfo = () => {
    if (notFound) {
      return {
        icon: AlertCircle,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        title: "Certificate Not Found",
        description: "No certificate found with this ID",
        badge: { variant: "destructive" as const, text: "Not Found" },
      };
    }
    if (isRevoked) {
      return {
        icon: XCircle,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        title: "Certificate Revoked",
        description: "This certificate has been revoked by the issuing institution",
        badge: { variant: "destructive" as const, text: "Revoked" },
      };
    }
    return {
      icon: CheckCircle,
      color: "text-accent",
      bgColor: "bg-accent/10",
      title: "Certificate Valid",
      description: "This certificate is authentic and has been verified on the blockchain",
      badge: { variant: "default" as const, text: "Valid" },
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Certificate Verification</h1>
              <p className="text-xs text-muted-foreground">Verification Result</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              New Verification
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className={`border-2 ${isValid ? 'border-accent/50' : 'border-destructive/50'}`}>
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className={`${statusInfo.bgColor} p-4 rounded-full`}>
                  <StatusIcon className={`h-8 w-8 ${statusInfo.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-foreground">{statusInfo.title}</h2>
                    <Badge variant={statusInfo.badge.variant}>{statusInfo.badge.text}</Badge>
                  </div>
                  <p className="text-muted-foreground">{statusInfo.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!notFound && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Details</CardTitle>
                  <CardDescription>Information verified on the blockchain</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Student Name</p>
                      <p className="font-semibold text-foreground">{mockCertificate.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Course Name</p>
                      <p className="font-semibold text-foreground">{mockCertificate.courseName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Grade</p>
                      <p className="font-semibold text-foreground">{mockCertificate.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Issue Date</p>
                      <p className="font-semibold text-foreground">{mockCertificate.issueDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">University</p>
                      <p className="font-semibold text-foreground">{mockCertificate.universityName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Certificate ID</p>
                      <p className="font-mono text-xs text-foreground">{mockCertificate.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Verification</CardTitle>
                  <CardDescription>Cryptographic proof of authenticity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                    <p className="font-mono text-xs text-foreground">{mockCertificate.walletAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Digital Signature</p>
                    <p className="font-mono text-xs text-foreground break-all">{mockCertificate.signature}</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      {isValid ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-accent" />
                          <span className="text-accent font-medium">Signature Verified</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span className="text-destructive font-medium">Signature Invalid</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="text-center">
            <Link to="/">
              <Button size="lg">Verify Another Certificate</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerificationResult;
