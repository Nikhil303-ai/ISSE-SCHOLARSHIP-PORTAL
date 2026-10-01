import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, isLoggedIn } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-3xl mx-auto text-center space-y-8 bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-600">
          Integrated Student Success Ecosystem
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Welcome to <span className="text-blue-600">ISSE</span>
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          {isAdmin
            ? "Access the administrative management suite to review student applications, verify submitted documents, and manage scholarship vector listings."
            : "Find scholarships, check eligibility instantly with AI vector matching, get personalized recommendations, and manage all your applications in one secure portal."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {isAdmin ? (
            <Link
              to="/admin"
              className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            >
              Go to Admin Portal →
            </Link>
          ) : (
            <>
              <Link
                to="/scholarships"
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
              >
                Browse Scholarships
              </Link>
              <Link
                to={isLoggedIn ? "/recommendations" : "/login"}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-xl transition"
              >
                AI Match Recommendations
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;