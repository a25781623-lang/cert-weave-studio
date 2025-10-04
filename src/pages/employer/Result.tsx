import { useParams, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, AlertCircle, ArrowLeft, Loader } from "lucide-react";
import axios from "axios";
import { Certificate } from "@/types/certificate";

const VerificationResult = () => {
  const { certificateId } = useParams();
  const location = useLocation();

  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'valid' | 'invalid'>('pending');
  const [certificateData, setCertificateData] = useState<Certificate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const verifyCertificate = async () => {
      const qrData = new URLSearchParams(location.search).get('qrData');
      if (!qrData) {
        setVerificationStatus('invalid');
        setErrorMessage("No certificate data was provided in the URL. Please scan a valid QR code.");
        return;
      }
      try {
        const response = await axios.post('http://localhost:3000/verify-certificate-from-qr', { qrData });
        if (response.data.valid) {
          setVerificationStatus('valid');
          setCertificateData(response.data.certificateData);
        } else {
          setVerificationStatus('invalid');
          setErrorMessage(response.data.message);
        }
      } catch (error: any) {
        setVerificationStatus('invalid');
        setErrorMessage(error.response?.data?.message || "A server error occurred during verification.");
      }
    };
    verifyCertificate();
  }, [location.search]);

  const getStatusInfo = () => {
    switch (verificationStatus) {
      case 'pending':
        return { icon: Loader, color: "text-muted-foreground", bgColor: "bg-muted/10", title: "Verifying Certificate...", description: "Please wait while we verify the certificate's authenticity.", badge: { variant: "default" as const, text: "Pending" } };
      case 'valid':
        return { icon: CheckCircle, color: "text-accent", bgColor: "bg-accent/10", title: "Certificate Valid", description: "This certificate is authentic and has been verified.", badge: { variant: "default" as const, text: "Valid" } };
      case 'invalid':
        return { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10", title: "Certificate Invalid", description: errorMessage, badge: { variant: "destructive" as const, text: "Invalid" } };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isValid = verificationStatus === 'valid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"> <div className="bg-primary/10 p-2 rounded-lg"> <Shield className="h-6 w-6 text-primary" /> </div> <div> <h1 className="text-xl font-bold text-foreground">Certificate Verification</h1> <p className="text-xs text-muted-foreground">Verification Result</p> </div> </div>
          <Link to="/"> <Button variant="outline" size="sm"> <ArrowLeft className="h-4 w-4 mr-2" /> New Verification </Button> </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className={`border-2 ${isValid ? 'border-accent/50' : 'border-destructive/50'}`}>
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className={`${statusInfo.bgColor} p-4 rounded-full`}> <StatusIcon className={`h-8 w-8 ${statusInfo.color} ${verificationStatus === 'pending' ? 'animate-spin' : ''}`} /> </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2"> <h2 className="text-2xl font-bold text-foreground">{statusInfo.title}</h2> <Badge variant={statusInfo.badge.variant}>{statusInfo.badge.text}</Badge> </div>
                  <p className="text-muted-foreground">{statusInfo.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {certificateData && (
            <>
              <Card>
                <CardHeader> <CardTitle>Certificate Details</CardTitle> <CardDescription>Information verified on the blockchain</CardDescription> </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div> <p className="text-sm text-muted-foreground mb-1">Student Name</p> <p className="font-semibold text-foreground">{certificateData.studentName}</p> </div>
                    <div> <p className="text-sm text-muted-foreground mb-1">Course Name</p> <p className="font-semibold text-foreground">{certificateData.courseName}</p> </div>
                    <div> <p className="text-sm text-muted-foreground mb-1">Grade</p> <p className="font-semibold text-foreground">{certificateData.grade}</p> </div>
                    <div> <p className="text-sm text-muted-foreground mb-1">Issue Date</p> <p className="font-semibold text-foreground">{certificateData.issueDate}</p> </div>
                    <div> <p className="text-sm text-muted-foreground mb-1">University</p> <p className="font-semibold text-foreground">{certificateData.universityName}</p> </div>
                    <div> <p className="text-sm text-muted-foreground mb-1">Certificate ID</p> <p className="font-mono text-xs text-foreground">{certificateData.id}</p> </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader> <CardTitle>Blockchain Verification</CardTitle> <CardDescription>Cryptographic proof of authenticity</CardDescription> </CardHeader>
                <CardContent className="space-y-4">
                  <div> <p className="text-sm text-muted-foreground mb-1">Wallet Address</p> <p className="font-mono text-xs text-foreground">{certificateData.walletAddress}</p> </div>
                  <div> <p className="text-sm text-muted-foreground mb-1">Digital Signature</p> <p className="font-mono text-xs text-foreground break-all">{certificateData.signature}</p> </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      {isValid ? ( <> <CheckCircle className="h-4 w-4 text-accent" /> <span className="text-accent font-medium">Signature Verified</span> </> ) : ( <> <XCircle className="h-4 w-4 text-destructive" /> <span className="text-destructive font-medium">Signature Invalid</span> </> )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          <div className="text-center"> <Link to="/"> <Button size="lg">Verify Another Certificate</Button> </Link> </div>
        </div>
      </main>
    </div>
  );
};

export default VerificationResult;