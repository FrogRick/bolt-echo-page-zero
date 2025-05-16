
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import EditorPage from "@/pages/EditorPage";
import NewProjectPage from "@/pages/NewProjectPage";
import NotFound from "@/pages/NotFound";
import AuthPage from "@/pages/AuthPage";
import AccountPage from "@/pages/AccountPage";
import PricingPage from "@/pages/PricingPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import DashboardPage from "@/pages/DashboardPage";
import TrashPage from "@/pages/TrashPage"; // Import the new TrashPage
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import SettingsPage from "@/pages/SettingsPage";
import { Toaster } from "@/components/ui/toaster";

// Modified homepage router to decide what to display based on login status
const HomeRouter = () => {
  const { user } = useAuth();
  
  // If logged in, show the buildings overview
  // If not logged in, show the new building form
  return user ? <HomePage /> : <NewProjectPage />;
};

// Modified ProtectedRoute component to handle subscription redirects
const ProtectedRoute = ({ children, requiresSubscription = false }: { 
  children: React.ReactNode,
  requiresSubscription?: boolean
}) => {
  // We'll use the local storage as a fallback for page refresh
  // The proper auth check is done in each protected component
  const hasSession = localStorage.getItem("sb-ohxecbcihwinyskhaysl-auth-token");
  
  if (!hasSession) {
    // Save the current path for redirect after login
    sessionStorage.setItem("authRedirect", window.location.pathname);
    return <Navigate to="/auth" replace />;
  }
  
  // If subscription is required, we'll check in the component itself
  // by examining user.subscription and redirecting to pricing if needed
  
  return <>{children}</>;
};

// Component that creates a new project and redirects to /editor/:projectId
function AutoCreateAndRedirectToEditor() {
  const navigate = useNavigate();
  useEffect(() => {
    // Create new project
    const newProject = {
      id: crypto.randomUUID(),
      name: "New Evacuation Plan",
      createdAt: new Date(),
      updatedAt: new Date(),
      pdfs: [],
      symbols: [],
    };
    // Save to localStorage
    const existing = localStorage.getItem("evacuation-projects");
    const projects = existing ? JSON.parse(existing) : [];
    projects.unshift(newProject);
    localStorage.setItem("evacuation-projects", JSON.stringify(projects));
    // Redirect
    navigate(`/editor/${newProject.id}`, { replace: true });
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/editor" replace />} />
            <Route path="/editor" element={<AutoCreateAndRedirectToEditor />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/editor/:projectId" element={<EditorPage />} />
            <Route path="/dashboard/:type" element={<DashboardPage />} />
            <Route path="/buildings" element={<DashboardPage typeOverride="buildings" />} />
            <Route path="/evacuation-plans" element={<DashboardPage typeOverride="evacuation-plans" />} />
            <Route path="/organizations" element={<DashboardPage typeOverride="organizations" />} />
            <Route path="/templates" element={<DashboardPage typeOverride="templates" />} />
            <Route path="/trash" element={<TrashPage />} /> {/* New trash page route */}
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/new" element={<NewProjectPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}
