import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import all the pages for your application
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UniversityLogin from "./pages/university/Login";
import UniversityRegister from "./pages/university/Register"; // The initial registration page
import CreateAccount from "./pages/university/CreateAccount"; // The final password-setting page
import UniversityDashboard from "./pages/university/Dashboard";
import ViewCertificates from "./pages/university/Certificates";
import RevokeCertificate from "./pages/university/Revoke";
import EmployerVerify from "./pages/employer/Verify";
import VerificationResult from "./pages/employer/Result";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Main and Employer Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/verify" element={<EmployerVerify />} />
          <Route path="/verify/result/:certificateId" element={<VerificationResult />} />

          {/* University Registration and Login Flow Routes */}
          <Route path="/university/login" element={<UniversityLogin />} />
          <Route path="/university/register" element={<UniversityRegister />} />
          <Route path="/create-account/:token" element={<CreateAccount />} />

          {/* Authenticated University Routes */}
          <Route path="/university/dashboard" element={<UniversityDashboard />} />
          <Route path="/university/certificates" element={<ViewCertificates />} />
          <Route path="/university/revoke" element={<RevokeCertificate />} />
          
          {/* Catch-all route for pages that don't exist */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;