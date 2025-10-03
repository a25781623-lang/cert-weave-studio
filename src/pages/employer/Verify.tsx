import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Search, QrCode, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const EmployerVerify = () => {
  const [certificateId, setCertificateId] = useState("");
  const navigate = useNavigate();

  const handleVerify = () => {
    if (certificateId) {
      navigate(`/verify/result/${certificateId}`);
    }
  };

  const handleQRScan = () => {
    // In a real implementation, this would open a QR scanner
    alert("QR Scanner would open here. For demo, please enter certificate ID manually.");
  };

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
              Enter a certificate ID or scan a QR code to verify authenticity
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
                <Label htmlFor="certificateId">Certificate ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="certificateId"
                    placeholder="Enter certificate ID (e.g., CERT-1704196800000)"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  />
                  <Button onClick={handleVerify}>
                    <Search className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button variant="outline" onClick={handleQRScan} className="w-full gap-2">
                <QrCode className="h-4 w-4" />
                Scan QR Code
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-secondary/50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-3">How Verification Works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Each certificate is stored on the blockchain with a unique identifier</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Digital signatures ensure authenticity and prevent tampering</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Verification happens in real-time against the blockchain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Revoked certificates are immediately flagged in the system</span>
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
