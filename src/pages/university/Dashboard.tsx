import { useState } from "react";
import { ethers } from "ethers"; // <-- Import ethers
import UniversitySidebar from "@/components/UniversitySidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Upload, Send, CheckCircle, Loader, AlertTriangle, Hash } from "lucide-react";
import axios from "axios";

// Define the steps for UI feedback
type IssuanceStep = 'idle' | 'verifying' | 'uploading' | 'hashing' | 'signing' | 'confirmed' | 'failed';

const UniversityDashboard = () => {
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
    const [txHash, setTxHash] = useState<string>("");
    const [issuanceStep, setIssuanceStep] = useState<IssuanceStep>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPdfFile(e.target.files[0]);
            // Reset state if a new file is chosen
            setIssuanceStep('idle');
            setQrCode('');
            setCertificateId('');
            setTxHash('');
        }
    };

    const handleIssueCertificate = async () => {
        if (!pdfFile || !formData.studentName || !formData.courseName || !formData.issueDate) {
            toast({ title: "Missing Information", description: "Please fill all fields and upload a PDF.", variant: "destructive" });
            return;
        }

        const token = localStorage.getItem('universityAuthToken');

        try {
            // STEP 1: Verify PDF Signature
            setIssuanceStep('verifying');
            const verificationFormData = new FormData();
            verificationFormData.append('pdf', pdfFile);
            await axios.post('http://localhost:3000/verify-signature', verificationFormData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            toast({ title: "Step 1/4: Signature Verified", description: "The certificate's digital signature is valid." });

            // STEP 2: Upload to IPFS
            setIssuanceStep('uploading');
            const uploadFormData = new FormData();
            uploadFormData.append('pdf', pdfFile);
            const uploadResponse = await axios.post('http://localhost:3000/upload-certificate', uploadFormData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            const { ipfsCid } = uploadResponse.data;
            toast({ title: "Step 2/4: Uploaded to IPFS", description: `File pinned with CID: ${ipfsCid.substring(0, 10)}...` });

            // STEP 3: Prepare Hash & Transaction
            setIssuanceStep('hashing');
            const hashResponse = await axios.post('http://localhost:3000/prepare-certificate-hash', {
                ipfsCid,
                studentName: formData.studentName,
                courseName: formData.courseName,
                issueDate: formData.issueDate,
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            const { unsignedTx, certificateId: newCertId, certificateHash } = hashResponse.data;
            toast({ title: "Step 3/4: Transaction Prepared", description: `Certificate hash created: ${certificateHash.substring(0, 12)}...` });

            // STEP 4: User Signs and Sends Transaction
            setIssuanceStep('signing');
            if (!window.ethereum) {
                throw new Error("MetaMask is not installed. Please install it to issue certificates.");
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            // Send the transaction
            const tx = await signer.sendTransaction(unsignedTx);
            toast({ title: "Step 4/4: Transaction Sent", description: "Waiting for blockchain confirmation..." });

            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            
            setCertificateId(newCertId);
            setQrCode(ipfsCid); // QR code contains the IPFS CID for retrieval
            setTxHash(receipt.hash);
            setIssuanceStep('confirmed');
            toast({ title: "Success!", description: "Certificate has been successfully recorded on the blockchain." });

        } catch (error: any) {
            setIssuanceStep('failed');
            console.error("Issuance failed:", error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
            toast({ title: "Issuance Failed", description: errorMessage, variant: "destructive" });
        }
    };
    
    // Helper to determine button text based on the current step
    const getButtonText = () => {
        switch (issuanceStep) {
            case 'idle': return 'Issue Certificate';
            case 'verifying': return 'Verifying Signature...';
            case 'uploading': return 'Uploading to IPFS...';
            case 'hashing': return 'Creating Hash...';
            case 'signing': return 'Please Confirm in Wallet...';
            case 'confirmed': return 'Issuance Complete!';
            case 'failed': return 'Retry Issuance';
            default: return 'Issue Certificate';
        }
    };
    
    // --- UPDATED sendToStudent function ---
    const sendToStudent = () => {
        const subject = encodeURIComponent(`Your Certificate - ${formData.courseName}`);
        const body = encodeURIComponent(
          `Dear ${formData.studentName},\n\nCongratulations! Your certificate has been issued.\n\nCertificate ID: ${certificateId}\nCGPA: ${formData.grade}\nIPFS Link: https://ipfs.io/ipfs/${qrCode}\nTransaction Hash: ${txHash}\n\nYou can verify your certificate at: ${window.location.origin}/verify\n\nBest regards,\nUniversity Portal`
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
                        <p className="text-muted-foreground">Follow the steps to issue a new blockchain certificate</p>
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
                                    <Input id="studentName" name="studentName" placeholder="John Doe" value={formData.studentName} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="studentEmail">Student Email</Label>
                                    <Input id="studentEmail" name="studentEmail" type="email" placeholder="john@example.com" value={formData.studentEmail} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="courseName">Course Name</Label>
                                    <Input id="courseName" name="courseName" placeholder="Computer Science Fundamentals" value={formData.courseName} onChange={handleChange} />
                                </div>
                                {/* --- UPDATED CGPA Input --- */}
                                <div className="space-y-2">
                                    <Label htmlFor="grade">CGPA</Label>
                                    <Input 
                                        id="grade" 
                                        name="grade"
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g., 9.5" 
                                        value={formData.grade} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="issueDate">Issue Date</Label>
                                <Input id="issueDate" name="issueDate" type="date" value={formData.issueDate} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pdfFile">Upload Signed Certificate PDF</Label>
                                <div className="flex items-center gap-4">
                                    <Input id="pdfFile" type="file" accept=".pdf" onChange={handleFileChange} className="flex-1" />
                                    {pdfFile && (
                                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Upload className="h-4 w-4" />
                                            {pdfFile.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button
                                onClick={handleIssueCertificate}
                                disabled={issuanceStep !== 'idle' && issuanceStep !== 'failed'}
                                className="w-full"
                            >
                                <Loader className={`mr-2 h-4 w-4 animate-spin ${['verifying', 'uploading', 'hashing', 'signing'].includes(issuanceStep) ? 'inline-block' : 'hidden'}`} />
                                {getButtonText()}
                            </Button>
                        </CardContent>
                    </Card>

                    {issuanceStep === 'confirmed' && qrCode && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><CheckCircle className="text-green-500 mr-2" />Certificate Issued Successfully</CardTitle>
                                <CardDescription>Certificate ID: {certificateId}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-secondary rounded-lg text-center">
                                    <p className="text-sm font-medium mb-2">IPFS Document CID</p>
                                    <QRCodeSVG value={qrCode} size={200} className="mx-auto" />
                                    <p className="text-xs text-muted-foreground mt-2 break-all">{qrCode}</p>
                                </div>
                                <div className="p-3 bg-secondary rounded-lg">
                                    <p className="text-sm font-medium flex items-center"><Hash className="h-4 w-4 mr-2"/>Transaction Hash</p>
                                    <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
                                        {txHash}
                                    </a>
                                </div>
                                <Button onClick={sendToStudent} className="w-full gap-2">
                                    <Send className="h-4 w-4" />
                                    Send to Student via Email
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                     {issuanceStep === 'failed' && (
                        <Card className="border-destructive">
                             <CardHeader>
                                <CardTitle className="flex items-center"><AlertTriangle className="text-destructive mr-2" />Issuance Failed</CardTitle>
                                <CardDescription>The process was interrupted. Please check the console for errors and try again.</CardDescription>
                            </CardHeader>
                        </Card>
                     )}
                </div>
            </main>
        </div>
    );
};

export default UniversityDashboard;