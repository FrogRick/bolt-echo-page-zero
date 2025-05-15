
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useAuth } from "@/context/AuthContext";

const Layout = () => {
  // Add useAuth to trigger re-renders when auth state changes
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="py-6 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600">
          Firemap © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
