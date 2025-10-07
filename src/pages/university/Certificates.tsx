import { useState } from "react";
import UniversitySidebar from "@/components/UniversitySidebar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { Certificate } from "@/types/certificate";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ViewCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      toast({
        title: "Invalid File",
        description: "Please upload a JSON file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        if (Array.isArray(jsonData)) {
          setCertificates(jsonData);
          toast({
            title: "Success",
            description: `Loaded ${jsonData.length} certificates`,
          });
        } else {
          toast({
            title: "Invalid Format",
            description: "JSON file must contain an array of certificates",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse JSON file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="flex min-h-screen bg-background">
      <UniversitySidebar />
      <main className="flex-1 p-8 ml-16">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">All Certificates</h1>
            <p className="text-muted-foreground">Upload JSON file to view certificates</p>
          </div>

          {certificates.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload Certificates Data</CardTitle>
                <CardDescription>Upload a JSON file containing certificate information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>Choose JSON File</span>
                    </Button>
                  </label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload a JSON file with certificate data
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Certificate Records</CardTitle>
                  <CardDescription>Total certificates: {certificates.length}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCertificates([]);
                    toast({
                      title: "Cleared",
                      description: "Certificate data cleared",
                    });
                  }}
                >
                  Clear Data
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">{cert.studentName}</TableCell>
                        <TableCell>{cert.courseName}</TableCell>
                        <TableCell>{cert.issueDate}</TableCell>
                        <TableCell className="font-mono text-xs">{cert.id}</TableCell>
                        <TableCell>
                          <Badge variant={cert.status === "active" ? "default" : "destructive"}>
                            {cert.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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