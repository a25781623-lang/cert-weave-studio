import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UniversitySidebar from "@/components/UniversitySidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Upload, Send } from "lucide-react";

const UniversityDashboard = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    courseName: "",
    grade: "",
    issueDate: new Date().toISOString().split('T')[0],
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [certificateId, setCertificateId] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const generateCertificate = () => {
    const newCertificateId = `CERT-${Date.now()}`;
    setCertificateId(newCertificateId);
    setQrCode(newCertificateId);
    
    toast({
      title: "Certificate Generated",
      description: "QR code created successfully",
    });
  };

  const sendToStudent = () => {
    const subject = encodeURIComponent(`Your Certificate - ${formData.courseName}`);
    const body = encodeURIComponent(
      `Dear ${formData.studentName},\n\nCongratulations! Your certificate has been issued.\n\nCertificate ID: ${certificateId}\nCourse: ${formData.courseName}\nGrade: ${formData.grade}\n\nYou can verify your certificate at: ${window.location.origin}/verify\n\nBest regards,\nUniversity Portal`
    );
    
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${formData.studentEmail}&su=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <UniversitySidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Issue Certificate</h1>
            <p className="text-muted-foreground">Create and issue a new blockchain certificate</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Certificate Details</CardTitle>
              <CardDescription>Enter student and course information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    name="studentName"
                    placeholder="John Doe"
                    value={formData.studentName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Student Email</Label>
                  <Input
                    id="studentEmail"
                    name="studentEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.studentEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input
                    id="courseName"
                    name="courseName"
                    placeholder="Computer Science Fundamentals"
                    value={formData.courseName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    name="grade"
                    placeholder="A+"
                    value={formData.grade}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfFile">Upload Signed Certificate PDF</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="pdfFile"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {pdfFile && (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {pdfFile.name}
                    </span>
                  )}
                </div>
              </div>

              <Button onClick={generateCertificate} className="w-full">
                Generate Certificate & QR Code
              </Button>
            </CardContent>
          </Card>

          {qrCode && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Certificate</CardTitle>
                <CardDescription>Certificate ID: {certificateId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center p-8 bg-secondary rounded-lg">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
                <Button onClick={sendToStudent} className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Send to Student via Email
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default UniversityDashboard;
