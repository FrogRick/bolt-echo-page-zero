
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import { useAuth } from "@/context/AuthContext";

const Layout = () => {
  // Add useAuth to trigger re-renders when auth state changes
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if the current route is the editor
  const isEditorPage = location.pathname.includes('/editor/');
  
  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 ${isEditorPage ? 'h-screen overflow-hidden' : ''}`}>
      <Header />
      <main className={`flex-1 ${isEditorPage ? 'w-full overflow-hidden' : 'container mx-auto px-4 py-8 overflow-auto'}`}>
        <Outlet />
      </main>
      {!isEditorPage && (
        <footer className="py-6 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center text-sm text-slate-600">
            Firemap © {new Date().getFullYear()}
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
