import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, GraduationCap, CheckCircle, Lock, Database } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">CertiChain</h1>
                <p className="text-sm text-muted-foreground">Blockchain Certificate Verification</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/verify">
                <Button variant="outline">Verify Certificate</Button>
              </Link>
              <Link to="/university/login">
                <Button>University Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-5xl font-bold text-foreground">
            Secure Certificate Verification
            <br />
            <span className="text-primary">Powered by Blockchain</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Issue, manage, and verify educational certificates with the security and transparency of blockchain technology
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/university/register">
              <Button size="lg" className="gap-2">
                <GraduationCap className="h-5 w-5" />
                Register University
              </Button>
            </Link>
            <Link to="/verify">
              <Button size="lg" variant="outline" className="gap-2">
                <Shield className="h-5 w-5" />
                Verify Certificate
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          <Card>
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Tamper-Proof</CardTitle>
              <CardDescription>
                Certificates are secured on the blockchain, making them impossible to forge or alter
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Instant Verification</CardTitle>
              <CardDescription>
                Employers can verify certificates in seconds using a simple ID or QR code scan
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Permanent Records</CardTitle>
              <CardDescription>
                All certificates are permanently stored on the blockchain with complete history
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">For Universities</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Issue digital certificates with blockchain verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Manage and revoke certificates as needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Generate QR codes for easy student sharing</span>
                    </li>
                  </ul>
                  <Link to="/university/register">
                    <Button className="mt-6">Get Started</Button>
                  </Link>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">For Employers</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Verify candidate credentials instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>No registration required for verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Check certificate status in real-time</span>
                    </li>
                  </ul>
                  <Link to="/verify">
                    <Button variant="outline" className="mt-6">Verify Now</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2024 CertiChain. Blockchain Certificate Verification System.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
