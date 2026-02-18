import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

const ProtectedRoute = () => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // We call a simple "me" or "profile" endpoint to verify the cookie
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-university-details`, {
          withCredentials: true 
        });
        setIsAuth(true);
      } catch {
        setIsAuth(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuth === null) return <div>Loading...</div>; // Prevent flicker

  return isAuth ? <Outlet /> : <Navigate to="/university/login" replace />;
};

export default ProtectedRoute;