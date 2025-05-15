
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Search, User as UserIcon, Settings, Building, HelpCircle, BookOpen, Flame, BookCopy, Shield } from "lucide-react";
import logoSvg from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { user, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const getUserInitials = () => {
    const meta = user?.user_metadata;
    if (meta?.first_name && meta?.last_name) {
      return `${meta.first_name[0]}${meta.last_name[0]}`;
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  const avatarUrl = user?.user_metadata?.avatar_url;

  // Navigation links for the header
  const mainNavItems = user ? [
    { path: "/evacuation-plans", label: "Evacuation Plans", icon: <Flame className="h-5 w-5" /> },
    { path: "/buildings", label: "Buildings", icon: <Building className="h-5 w-5" /> },
    { path: "/organizations", label: "Organizations", icon: <UserIcon className="h-5 w-5" /> },
    { path: "/templates", label: "Templates", icon: <BookCopy className="h-5 w-5" /> },
  ] : [
    { path: "/editor", label: "Editor" },
    { path: "/pricing", label: "Pricing" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex-1 px-4 lg:px-6 flex items-center h-full">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center">
            <img src={logoSvg} alt="Firemap Logo" className="h-7 w-7 mr-2" />
            <span className="text-lg font-semibold text-primary">Firemap</span>
          </Link>
        </div>
        {/* Main navigation links - centered */}
        <div className="flex-grow flex justify-center">
          <div className="hidden md:flex space-x-1">
            {mainNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.icon && (
                  <span className={`mr-1.5 ${
                    location.pathname === item.path
                      ? "text-primary"
                      : "text-gray-500"
                  }`}>
                    {item.icon}
                  </span>
                )}
                {item.label}
          </Link>
            ))}
          </div>
        </div>
        {/* Right side elements */}
        <div className="flex-shrink-0 flex items-center space-x-3">
          {/* Notifications-knapp borttagen */}
          {/* Visa profilmeny om inloggad, annars Sign Up / Login */}
          {user ? (
            <div className="relative" ref={profileMenuRef}>
              <div>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center justify-center p-1 rounded-full hover:bg-gray-50 focus:outline-none transition-colors border border-transparent hover:border-gray-200"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  <Avatar className="h-8 w-8 border-2 border-primary/10">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">{getUserInitials()}</AvatarFallback>
                    )}
                  </Avatar>
                </button>
              </div>
              {isProfileMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1 px-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                          : user?.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || 'Account settings'}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/subscription"
                        className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Shield className="mr-2 h-4 w-4 text-gray-500" />
                        Subscription & Billing
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Settings className="mr-2 h-4 w-4 text-gray-500" />
                        Settings
                  </Link>
                    </div>
                    <div className="py-1 border-t border-gray-100">
                      <Link
                        to="/help"
                        className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <HelpCircle className="mr-2 h-4 w-4 text-gray-500" />
                        Help Center
                  </Link>
                      <Link
                        to="/docs"
                        className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <BookOpen className="mr-2 h-4 w-4 text-gray-500" />
                        Documentation
                  </Link>
                    </div>
                    <div className="py-1 border-t border-gray-100">
                      <button
                        onClick={signOut}
                        className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left"
                      >
                        <LogOut className="mr-2 h-4 w-4 text-gray-500" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/auth?tab=signup">Sign Up</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Login</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
