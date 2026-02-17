import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Shield } from "lucide-react";
import axios from "axios"; // <-- Import axios

const UniversityLogin = () => {
  // We now use email instead of username for login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send login credentials to the backend
      const response = await axios.post('http://localhost:3000/login', {
        email,
        password,
      });

      // If login is successful, the backend sends back a token.
      // We save this token in the browser's local storage.
      // This is how the app "remembers" that the user is logged in.
      localStorage.setItem("universityAuthToken", response.data.token);

      toast({
        title: "Login Successful",
        description: "Welcome back to the University Portal",
      });
      navigate("/university/dashboard");

    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">University Portal</CardTitle>
          <CardDescription>Sign in to manage certificates</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your university email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{" "}
              <Link to="/university/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground text-center flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              Employer Verification Portal
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UniversityLogin;