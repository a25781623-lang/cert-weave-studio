import { useState } from "react";
import UniversitySidebar from "@/components/UniversitySidebar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";
import { Certificate } from "@/types/certificate";
import { Button } from "@/components/ui/button";

const mockCertificates: Certificate[] = [
  {
    id: "CERT-1704196800000",
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
  },
  {
    id: "CERT-1704110400000",
    studentName: "Jane Smith",
    studentEmail: "jane@example.com",
    courseName: "Data Structures & Algorithms",
    issueDate: "2024-01-01",
    grade: "A",
    universityName: "Stanford University",
    walletAddress: "0x1234...5678",
    publicKey: "pub_key_123",
    signature: "sig_124",
    status: "active",
  },
  {
    id: "CERT-1703937600000",
    studentName: "Mike Johnson",
    studentEmail: "mike@example.com",
    courseName: "Web Development Bootcamp",
    issueDate: "2023-12-30",
    grade: "B+",
    universityName: "Stanford University",
    walletAddress: "0x1234...5678",
    publicKey: "pub_key_123",
    signature: "sig_125",
    status: "revoked",
  },
];

const ViewCertificates = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [certificates] = useState<Certificate[]>(mockCertificates);

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <UniversitySidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">All Certificates</h1>
            <p className="text-muted-foreground">View and manage issued certificates</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Certificates</CardTitle>
              <CardDescription>Filter by student name, course, or certificate ID</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredCertificates.map((cert) => (
              <Card key={cert.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{cert.studentName}</h3>
                        <Badge variant={cert.status === "active" ? "default" : "destructive"}>
                          {cert.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Course:</span>{" "}
                          <span className="font-medium">{cert.courseName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Grade:</span>{" "}
                          <span className="font-medium">{cert.grade}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Certificate ID:</span>{" "}
                          <span className="font-mono text-xs">{cert.id}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Issue Date:</span>{" "}
                          <span className="font-medium">{cert.issueDate}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCertificates.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No certificates found matching your search</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewCertificates;
