import { useState, useEffect } from "react";
import UniversitySidebar from "@/components/UniversitySidebar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";
import { Certificate } from "@/types/certificate";
import { Button } from "@/components/ui/button";

// The hardcoded mockCertificates array has been removed.

const ViewCertificates = () => {
  const [searchTerm, setSearchTerm] = useState("");
  // Initialize certificates state with an empty array.
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  // Add a loading state for better user experience
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    // This function will fetch the real certificate data.
    const fetchCertificates = async () => {
      setIsLoading(true);
      try {
        // =================================================================
        // TODO: IMPLEMENT YOUR BLOCKCHAIN LOGIC HERE
        // 1. Connect to your smart contract using ethers.js.
        // 2. Call a function on your contract to get all issued certificate IDs.
        //    (You may need to add a function like `getAllCertificateIds` to your contract
        //    that returns the array of all certificate IDs you have issued).
        // 3. Loop through the IDs and fetch the details for each certificate.
        // 4. Format the data to match the `Certificate` type.
        // 5. Update the state with the fetched data using `setCertificates()`.
        //
        // For now, we will set it to an empty array.
        // =================================================================
        
        // Example of what the fetched data might look like:
        // const realCertificates = await yourContractFunction(); 
        // setCertificates(realCertificates);

      } catch (error) {
        console.error("Failed to fetch certificates:", error);
        // You can also add a toast notification here to inform the user.
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, []); // The empty dependency array means this runs once when the component mounts.


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

        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Loading certificates from the blockchain...</p>
            </CardContent>
          </Card>
        ) : (
          <>
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
          </>
        )}
        </div>
      </main>
    </div>
  );
};

export default ViewCertificates;