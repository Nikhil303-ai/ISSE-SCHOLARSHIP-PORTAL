import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  // 1. Wait for AuthContext to finished initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium text-sm">
        Verifying session...
      </div>
    );
  }

  // 2. Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Check role requirement if specified (e.g. role="admin")
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return children;
}

export default ProtectedRoute;