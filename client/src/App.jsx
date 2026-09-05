import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { DesignationProvider } from "./context/DesignationContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Directory from "./pages/directory/Directory";
import StartupDetail from "./pages/directory/StartupDetail";
import BuildersDirectory from "./pages/builder/BuildersDirectory";
import FounderDashboard from "./pages/founder/FounderDashboard";
import InvestorDashboard from "./pages/investor/InvestorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCaseDetail from "./pages/admin/AdminCaseDetail";
import AdminBuilders from "./pages/admin/AdminBuilders";
import CreateStartup from "./pages/founder/CreateStartup";
import DataRoom from "./pages/founder/DataRoom";
import VerifyEmail from "./pages/auth/VerifyEmail";
import FounderCertificate from "./pages/founder/FounderCertificate";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import CitizenBuilders from "./pages/citizen/CitizenBuilders";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/admin/AdminUsers";
import Opportunities from "./pages/Opportunities";
import AdminOpportunities from "./pages/admin/AdminOpportunities";
import InvestorOpportunities from "./pages/investor/InvestorOpportunities";
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard";
import ReviewerBuilders from "./pages/reviewer/ReviewerBuilders";
import ModeratorStartups from "./pages/moderator/ModeratorStartups";
import ModeratorBuilders from "./pages/moderator/ModeratorBuilders";
import BuilderApplication from "./pages/builder/BuilderApplication";
import BuilderDashboard from "./pages/builder/BuilderDashboard";
import VerificationPage from "./pages/VerificationPage";
import VerificationQueue from "./pages/reviewer/VerificationQueue";

function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  const needsVerification = [
    "founder",
    "investor",
    "ecosystem_builder",
  ].includes(user.role);
  const isVerificationPath = location.pathname === "/verification";
  const isProfilePath = location.pathname === "/profile";
  if (
    needsVerification &&
    user.verificationStatus !== "approved" &&
    !isVerificationPath &&
    !isProfilePath
  ) {
    return <Navigate to="/verification" replace />;
  }

  return children;
}

function roleHome(role) {
  if (role === "founder") return "/founder";
  if (role === "investor") return "/investor";
  if (role === "admin") return "/admin/analytics";
  if (role === "reviewer") return "/reviewer";
  if (role === "moderator") return "/moderator";
  if (role === "citizen") return "/citizen";
  if (role === "ecosystem_builder") return "/builder";
  return "/";
}

function PublicOnlyRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <PublicLayout>
              <Login />
            </PublicLayout>
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <PublicLayout>
              <Register />
            </PublicLayout>
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicOnlyRoute>
            <PublicLayout>
              <VerifyEmail />
            </PublicLayout>
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <PublicLayout>
              <ForgotPassword />
            </PublicLayout>
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/verification"
        element={
          <ProtectedRoute>
            <VerificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/verifications"
        element={
          <ProtectedRoute roles={["admin", "reviewer"]}>
            <VerificationQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verifications"
        element={
          <ProtectedRoute roles={["admin"]}>
            <VerificationQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnlyRoute>
            <PublicLayout>
              <ResetPassword />
            </PublicLayout>
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/directory"
        element={
          <PublicLayout>
            <Directory />
          </PublicLayout>
        }
      />
      <Route
        path="/directory/:id"
        element={
          <PublicLayout>
            <StartupDetail />
          </PublicLayout>
        }
      />
      <Route
        path="/builders"
        element={
          <PublicLayout>
            <BuildersDirectory />
          </PublicLayout>
        }
      />

      {/* Founder */}
      <Route
        path="/founder"
        element={
          <ProtectedRoute roles={["founder"]}>
            <FounderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/founder/create"
        element={
          <ProtectedRoute roles={["founder"]}>
            <CreateStartup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/founder/data-room"
        element={
          <ProtectedRoute roles={["founder"]}>
            <DataRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/founder/certificate"
        element={
          <ProtectedRoute roles={["founder"]}>
            <FounderCertificate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/founder/opportunities"
        element={
          <ProtectedRoute roles={["founder"]}>
            <Opportunities embedded />
          </ProtectedRoute>
        }
      />

      {/* Investor */}
      <Route
        path="/investor"
        element={
          <ProtectedRoute roles={["investor"]}>
            <InvestorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investor/directory"
        element={
          <ProtectedRoute roles={["investor"]}>
            <Directory embedded />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investor/directory/:id"
        element={
          <ProtectedRoute roles={["investor"]}>
            <StartupDetail embedded />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investor/builders"
        element={
          <ProtectedRoute roles={["investor"]}>
            <BuildersDirectory embedded />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investor/opportunities"
        element={
          <ProtectedRoute roles={["investor"]}>
            <InvestorOpportunities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investor/browse-opportunities"
        element={
          <ProtectedRoute roles={["investor"]}>
            <Opportunities embedded />
          </ProtectedRoute>
        }
      />

      {/* Citizen */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute roles={["citizen"]}>
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/directory"
        element={
          <ProtectedRoute roles={["citizen"]}>
            <Directory embedded />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/directory/:id"
        element={
          <ProtectedRoute roles={["citizen"]}>
            <StartupDetail embedded />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/builders"
        element={
          <ProtectedRoute roles={["citizen"]}>
            <CitizenBuilders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/opportunities"
        element={
          <ProtectedRoute roles={["citizen"]}>
            <Opportunities embedded />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cases/:id"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminCaseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/opportunities"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminOpportunities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/builders"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminBuilders />
          </ProtectedRoute>
        }
      />

      {/* Reviewer */}
      <Route
        path="/reviewer"
        element={
          <ProtectedRoute roles={["reviewer"]}>
            <ReviewerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/cases/:id"
        element={
          <ProtectedRoute roles={["reviewer"]}>
            <AdminCaseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/opportunities"
        element={
          <ProtectedRoute roles={["reviewer"]}>
            <Opportunities embedded />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/builders"
        element={
          <ProtectedRoute roles={["reviewer"]}>
            <ReviewerBuilders />
          </ProtectedRoute>
        }
      />

      {/* Moderator */}
      <Route
        path="/moderator"
        element={
          <ProtectedRoute roles={["moderator"]}>
            <AdminOpportunities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/moderator/startups"
        element={
          <ProtectedRoute roles={["moderator"]}>
            <ModeratorStartups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/moderator/builders"
        element={
          <ProtectedRoute roles={["moderator"]}>
            <ModeratorBuilders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/moderator/browse"
        element={
          <ProtectedRoute roles={["moderator"]}>
            <Opportunities embedded />
          </ProtectedRoute>
        }
      />

      {/* Ecosystem Builder — MUST use BuilderDashboard, not FounderDashboard */}
      <Route
        path="/builder"
        element={
          <ProtectedRoute roles={["ecosystem_builder"]}>
            <BuilderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/builder/apply"
        element={
          <ProtectedRoute roles={["ecosystem_builder"]}>
            <BuilderApplication />
          </ProtectedRoute>
        }
      />
      <Route
        path="/builder/opportunities"
        element={
          <ProtectedRoute roles={["ecosystem_builder"]}>
            <Opportunities embedded />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/opportunities"
        element={
          <ProtectedRoute>
            <OpportunitiesRedirect />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function OpportunitiesRedirect() {
  const { user } = useAuth();
  if (user?.role === "citizen")
    return <Navigate to="/citizen/opportunities" replace />;
  if (user?.role === "investor")
    return <Navigate to="/investor/browse-opportunities" replace />;
  if (user?.role === "admin")
    return <Navigate to="/admin/opportunities" replace />;
  if (user?.role === "founder")
    return <Navigate to="/founder/opportunities" replace />;
  if (user?.role === "reviewer")
    return <Navigate to="/reviewer/opportunities" replace />;
  if (user?.role === "moderator") return <Navigate to="/moderator" replace />;
  if (user?.role === "ecosystem_builder")
    return <Navigate to="/builder/opportunities" replace />;
  return <Opportunities />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DesignationProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </DesignationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
