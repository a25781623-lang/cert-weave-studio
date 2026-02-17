import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, FileText, List, XCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const UniversitySidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
    <aside className="group fixed left-0 top-0 w-16 hover:w-64 bg-card border-r border-border flex flex-col h-screen z-10 transition-all duration-300 ease-in-out">
      <div className="p-4 border-b border-border flex items-center gap-3 overflow-hidden">
        <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h2 className="font-semibold text-foreground">University</h2>
          <p className="text-xs text-muted-foreground">Portal</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            to={item.url}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              isActive(item.url)
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-secondary"
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
              {item.title}
            </span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 px-3 py-3"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
            Logout
          </span>
        </Button>
      </div>
    </aside>
  );
};

export default UniversitySidebar;