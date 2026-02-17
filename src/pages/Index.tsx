import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  GraduationCap,
  CheckCircle,
  Lock,
  Database,
  Building2,
  FilePlus2,
  Download,
  KeyRound,
  PenSquare,
  Share2,
  BadgeCheck,
} from "lucide-react";

const Index = () => {
  // The handleDownload function is no longer needed and has been removed.

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
                <h1 className="text-2xl font-bold text-foreground">
                  CertiChain
                </h1>
                <p className="text-sm text-muted-foreground">
                  Blockchain Certificate Verification
                </p>
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

      <main>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-5xl font-bold text-foreground">
              Secure Certificate Verification
              <br />
              <span className="text-primary">Powered by Blockchain</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Issue, manage, and verify educational certificates with the
              security and transparency of blockchain technology
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
                  Certificates are secured on the blockchain, making them
                  impossible to forge or alter
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
                  Employers can verify certificates in seconds using a simple ID
                  or QR code scan
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
                  All certificates are permanently stored on the blockchain with
                  complete history
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4">
                      For Universities
                    </h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                        <span>
                          Issue digital certificates with blockchain verification
                        </span>
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
                    <h3 className="text-xl font-bold text-foreground mb-4">
                      For Employers
                    </h3>
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
                      <Button variant="outline" className="mt-6">
                        Verify Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <section className="bg-slate-900 text-white py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Follow these three simple steps to get your certificates issued
                and verified on the blockchain.
              </p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px -translate-y-1/2">
                <div className="w-5/6 mx-auto border-t-2 border-dashed border-slate-600"></div>
              </div>
              <div className="relative grid md:grid-cols-3 gap-12 md:gap-8">
                <div className="relative text-center flex flex-col items-center">
                  <div className="absolute -top-12 -z-0 text-[120px] font-extrabold text-slate-700/80">
                    01
                  </div>
                  <div className="relative z-10 bg-slate-800 h-28 w-28 rounded-full flex items-center justify-center border-4 border-slate-900">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold">Register University</h3>
                  <p className="mt-2 text-slate-400">
                    Whitelist your university and register on our platform to get
                    started.
                  </p>
                </div>
                <div className="relative text-center flex flex-col items-center">
                  <div className="absolute -top-12 -z-0 text-[120px] font-extrabold text-slate-700/80">
                    02
                  </div>
                  <div className="relative z-10 bg-slate-800 h-28 w-28 rounded-full flex items-center justify-center border-4 border-slate-900">
                    <FilePlus2 className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold">Issue Certificate</h3>
                  <p className="mt-2 text-slate-400">
                    Use our secure portal to issue blockchain-based certificates
                    to your students.
                  </p>
                </div>
                <div className="relative text-center flex flex-col items-center">
                  <div className="absolute -top-12 -z-0 text-[120px] font-extrabold text-slate-700/80">
                    03
                  </div>
                  <div className="relative z-10 bg-slate-800 h-28 w-28 rounded-full flex items-center justify-center border-4 border-slate-900">
                    <Shield className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold">Verify Certificate</h3>
                  <p className="mt-2 text-slate-400">
                    Anyone can instantly verify the authenticity of a certificate
                    using its unique ID.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PDF Signing App Download Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <Download className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                The Official PDF Signing App
              </h2>
              <p className="text-xl text-muted-foreground mb-12">
                To issue secure, verifiable certificates, universities must use our desktop application.
                It allows you to generate cryptographic keys and digitally sign PDFs before uploading.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-12">
                <div className="flex flex-col items-center">
                  <div className="bg-card/80 p-4 rounded-full border border-border">
                    <KeyRound className="h-8 w-8 text-primary" />
                  </div>
                  <span className="font-semibold mt-4">Generate Keys</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-card/80 p-4 rounded-full border border-border">
                    <PenSquare className="h-8 w-8 text-primary" />
                  </div>
                  <span className="font-semibold mt-4">Sign PDF</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-card/80 p-4 rounded-full border border-border">
                    <Share2 className="h-8 w-8 text-primary" />
                  </div>
                  <span className="font-semibold mt-4">Share Public Key</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-card/80 p-4 rounded-full border border-border">
                    <BadgeCheck className="h-8 w-8 text-primary" />
                  </div>
                  <span className="font-semibold mt-4">Verify Signature</span>
                </div>
              </div>

              {/* --- THIS IS THE UPDATED BUTTON --- */}
              <Button size="lg" asChild className="gap-2 text-lg px-8 py-6">
                <a href="/CertificateSignerSetup_v1.0.0.exe" download>
                  <Download className="h-5 w-5" />
                  Download CertificateSigner v1.0.0
                </a>
              </Button>
              
              <p className="text-sm text-muted-foreground mt-4">
                Available for Windows, macOS, and Linux
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2024 CertiChain. Blockchain Certificate Verification System.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;