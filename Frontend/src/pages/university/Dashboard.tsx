/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import UniversitySidebar from "@/components/UniversitySidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Upload, Send, CheckCircle, Loader, AlertTriangle, Hash } from "lucide-react";
import axios from "axios";

// Define the steps for UI feedback
type IssuanceStep = 'idle' | 'verifying' | 'uploading' | 'hashing' | 'signing' | 'confirmed' | 'failed';

interface CertificateDataForEmail {
  ipfsCid: string;
  studentName: string;
  universityName: string;
  courseName: string;
  issueDate: string;
  walletAddress: string;
  publicKey: string;
  grade: string;
}

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
    const [qrCodeData, setQrCodeData] = useState<string>("");
    const [certificateId, setCertificateId] = useState<string>("");
    const [txHash, setTxHash] = useState<string>("");
    const [issuanceStep, setIssuanceStep] = useState<IssuanceStep>('idle');
    const [universityDetails, setUniversityDetails] = useState({ name: '', publicKey: '' });
    const [certificateDataForEmail, setCertificateDataForEmail] = useState<CertificateDataForEmail | null>(null);
    const { toast } = useToast();
    

useEffect(() => {
    
    const fetchUniversityDetails = async () => {
        
        
        try {
            // No need to manually get token from localStorage anymore
            
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/get-university-details`, 
                { 
                    // This is CRITICAL for sending HttpOnly cookies
                    withCredentials: true 
                }
            );
            setUniversityDetails(response.data);
            } catch (error: unknown) { // TypeScript defaults this to unknown
            let errorMessage = "An unexpected error occurred.";

            // Narrowing the type safely
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === "string") {
                errorMessage = error;
            }

            console.error("Logout failed:", error);
            toast({
                title: "Logout Error",
                description: errorMessage,
                variant: "destructive",
            });
            
            navigate("/university/login");
        }
        };
    fetchUniversityDetails();
}, []);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPdfFile(e.target.files[0]);
            setIssuanceStep('idle');
            setQrCodeData('');
            setCertificateId('');
            setTxHash('');
            setCertificateDataForEmail(null);
        }
    };

    const handleIssueCertificate = async () => {
        if (!pdfFile || !formData.studentName || !formData.courseName || !formData.issueDate || !formData.studentEmail) {
            toast({ title: "Missing Information", description: "Please fill all fields (including student email) and upload a PDF.", variant: "destructive" });
            return;
        }
        if (!universityDetails.name || !universityDetails.publicKey) {
            toast({ title: "University Details Missing", description: "Could not find your university's details. Please refresh and try again.", variant: "destructive" });
            return;
        }

        

        try {
            setIssuanceStep('verifying');
            const verificationFormData = new FormData();
            verificationFormData.append('pdf', pdfFile);
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/verify-signature`, verificationFormData, {
                        withCredentials: true,
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
            toast({ title: "Step 1/4: Signature Verified", description: "The certificate's digital signature is valid." });

            setIssuanceStep('uploading');
            const uploadFormData = new FormData();
            uploadFormData.append('pdf', pdfFile);
            const uploadResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/upload-certificate`, uploadFormData, {
                        withCredentials: true,
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
            const { ipfsCid } = uploadResponse.data;
            toast({ title: "Step 2/4: Uploaded to IPFS", description: `File pinned with CID: ${ipfsCid.substring(0, 10)}...` });

            setIssuanceStep('hashing');
            const hashResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/prepare-certificate-hash`, {
                ...formData,
                ipfsCid,
            }, { withCredentials: true });

            const { unsignedTx, certificateId: newCertId, certificateHash, certificateDataForJson } = hashResponse.data;
            setCertificateDataForEmail(certificateDataForJson);
            toast({ title: "Step 3/4: Transaction Prepared", description: `Certificate hash created: ${certificateHash.substring(0, 12)}...` });

            setIssuanceStep('signing');
            if (!window.ethereum) {
                throw new Error("MetaMask is not installed. Please install it to issue certificates.");
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const tx = await signer.sendTransaction(unsignedTx);
            toast({ title: "Step 4/4: Transaction Sent", description: "Waiting for blockchain confirmation..." });

            const receipt = await tx.wait();
            console.log(receipt)

            if (!receipt) {
                throw new Error("Transaction failed: No receipt was returned.");
            }

            const rawQrData = `${ipfsCid}|${formData.studentName}|${universityDetails.name}|${formData.courseName}|${formData.issueDate}|${await signer.getAddress()}|${universityDetails.publicKey}|${newCertId}|${formData.grade}`;
            const verificationUrl = `${window.location.origin}/verify/result?qrData=${encodeURIComponent(rawQrData)}`;


            setCertificateId(newCertId);
            setQrCodeData(verificationUrl);
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

    const sendToStudent = async () => {
        if (!certificateDataForEmail || !certificateId) {
            toast({ title: "Error", description: "Certificate data is not available to send.", variant: "destructive" });
            return;
        }

        try {
            toast({ title: "Sending Email...", description: "Please wait." });

        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/send-certificate-email`, {
                    studentEmail: formData.studentEmail,
                    studentName: formData.studentName,
                    certificateId: certificateId,
                    certificateData: certificateDataForEmail,
                }, {
                    withCredentials: true // Crucial for identifying the university sender
                });

            toast({ title: "Email Sent Successfully!", description: `Certificate details and data file sent to ${formData.studentEmail}` });

        } catch (error: any) {
            console.error("Failed to send email:", error);
            const errorMessage = error.response?.data?.message || "An unexpected error occurred.";
            toast({ title: "Email Failed to Send", description: errorMessage, variant: "destructive" });
        }
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
                                {/* --- FIX: The missing closing div tag was here --- */}
                            </div>
                            <Button
                                onClick={handleIssueCertificate}
                                disabled={issuanceStep !== 'idle' && issuanceStep !== 'failed'}
                                className="w-full"
                                // --- FIX: Removed the invalid '_BANNED_' props ---
                            >
                                <Loader className={`mr-2 h-4 w-4 animate-spin ${['verifying', 'uploading', 'hashing', 'signing'].includes(issuanceStep) ? 'inline-block' : 'hidden'}`} />
                                {getButtonText()}
                            </Button>
                        </CardContent>
                    </Card>

                    {issuanceStep === 'confirmed' && qrCodeData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><CheckCircle className="text-green-500 mr-2" />Certificate Issued Successfully</CardTitle>
                                <CardDescription>Certificate ID: {certificateId}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-secondary rounded-lg text-center">
                                    <p className="text-sm font-medium mb-2">Certificate QR Code</p>
                                    <QRCodeSVG value={qrCodeData} size={200} className="mx-auto" />
                                    <p className="text-xs text-muted-foreground mt-2 break-all">{qrCodeData}</p>
                                </div>
                                <div className="p-3 bg-secondary rounded-lg">
                                    <p className="text-sm font-medium flex items-center"><Hash className="h-4 w-4 mr-2" />Transaction Hash</p>
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