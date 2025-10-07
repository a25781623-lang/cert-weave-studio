import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, FileText, List, XCircle, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const UniversitySidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { title: "Issue Certificate", url: "/university/dashboard", icon: FileText },
    { title: "View All Certificates", url: "/university/certificates", icon: List },
    { title: "Revoke Certificate", url: "/university/revoke", icon: XCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("universityAuth");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    navigate("/university/login");
  };

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-card border-r border-border transition-all duration-300 flex flex-col h-screen`}
    >
      <div className="p-6 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">University</h2>
              <p className="text-xs text-muted-foreground">Portal</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            to={item.url}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive(item.url)
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-secondary"
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start gap-3 ${collapsed ? "px-2" : ""}`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
};

export default UniversitySidebar;
