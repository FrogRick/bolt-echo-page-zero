
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
import OrganizationsPage from "@/pages/OrganizationsPage";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";

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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomeRouter />} />
            <Route path="/new" element={<NewProjectPage />} />
            <Route path="/editor/:projectId" element={<EditorPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/account" element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            } />
            <Route path="/organizations" element={
              <ProtectedRoute>
                <OrganizationsPage />
              </ProtectedRoute>
            } />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/subscription" element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
        {/* Toaster component removed */}
      </Router>
    </AuthProvider>
  );
}
