import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  PanelLeft,
  Search,
  ShoppingCart,
  Users,
  FileText,
  ShieldAlert,
  History, // Import the History icon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const UniversitySidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="hidden w-20 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          to="/university/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">CertiChain</span>
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/university/dashboard"
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isActive("/university/dashboard")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              } transition-colors hover:text-foreground md:h-8 md:w-8`}
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Dashboard</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/university/certificates"
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isActive("/university/certificates")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              } transition-colors hover:text-foreground md:h-8 md:w-8`}
            >
              <FileText className="h-5 w-5" />
              <span className="sr-only">Certificates</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Certificates</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/university/revoke"
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isActive("/university/revoke")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              } transition-colors hover:text-foreground md:h-8 md:w-8`}
            >
              <ShieldAlert className="h-5 w-5" />
              <span className="sr-only">Revoke</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Revoke</TooltipContent>
        </Tooltip>
        {/* Add the new link to the Events page */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/university/events"
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isActive("/university/events")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              } transition-colors hover:text-foreground md:h-8 md:w-8`}
            >
              <History className="h-5 w-5" />
              <span className="sr-only">Events</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Events</TooltipContent>
        </Tooltip>
      </nav>
    </aside>
  );
};

export default UniversitySidebar;