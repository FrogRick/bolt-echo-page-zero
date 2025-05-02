
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, LogOut, Settings, CreditCard, Building } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const {
    user,
    signOut,
    subscription
  } = useAuth();
  
  return <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-black/0 px-0 py-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32">
              <rect width="100" height="100" fill="#19e16c" rx="25" ry="25" />
              <g fill="white">
                <path d="M50 12 Q54 20, 65 30 L58 30 L58 50 L42 50 L42 30 L35 30 Q46 20, 50 12 Z" />
                <path d="M88 50 Q80 54, 70 65 L70 58 L50 58 L50 42 L70 42 L70 35 Q80 46, 88 50 Z" />
                <path d="M50 88 Q46 80, 35 70 L42 70 L42 50 L58 50 L58 70 L65 70 Q54 80, 50 88 Z" />
                <path d="M12 50 Q20 46, 30 35 L30 42 L50 42 L50 58 L30 58 L30 65 Q20 54, 12 50 Z" />
              </g>
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight bg-gradient-to-r from-[#19e16c] to-[#19e16c] bg-clip-text text-transparent">Firemap</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link to="/pricing" className="text-sm font-medium hover:text-primary">
            Pricing
          </Link>
          {user && <Link to="/account" className="text-sm font-medium hover:text-primary">
              Account
            </Link>}
        </div>
        
        {user ? <div className="flex items-center gap-4">
            {subscription.tier !== "free" && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hidden md:flex">
                {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
              </Badge>}
            
            <Button asChild variant="outline">
              <Link to="/new">New Building</Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-sm font-medium">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <Settings className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/organizations">
                    <Building className="mr-2 h-4 w-4" />
                    Organizations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/subscription">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div> : <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?tab=signup">
                Sign Up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>}
      </div>
    </header>;
};

export default Header;
