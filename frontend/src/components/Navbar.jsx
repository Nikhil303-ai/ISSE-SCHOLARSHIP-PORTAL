import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ISSE Portal
          </span>
        </Link>

        {/* Dynamic Navigation Based on Role */}
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
            Home
          </Link>

          {/* Student & Public Navigation Links */}
          {!isAdmin && (
            <>
              <Link to="/scholarships" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
                Browse Scholarships
              </Link>
              {isLoggedIn && (
                <Link to="/recommendations" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
                  AI Match
                </Link>
              )}
            </>
          )}

          {/* Admin Navigation Badge */}
          {isLoggedIn && isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Admin Portal
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                to={isAdmin ? "/admin" : "/dashboard"}
                className="text-sm font-semibold text-slate-700 hover:text-blue-600"
              >
                {user?.name || (isAdmin ? "Admin" : "Student")}
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600">
                Log in
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;