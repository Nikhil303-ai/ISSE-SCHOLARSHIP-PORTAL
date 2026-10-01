import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../api";

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (role === "admin" && !organization.trim()) {
      toast.error("Please enter your Organization / College Authority Name.");
      return;
    }

    if (role === "student" && (!college.trim() || !branch.trim())) {
      toast.error("Please enter your College Name and Branch.");
      return;
    }

    const toastId = toast.loading("Creating account...");

    // Construct Payload cleanly based on account role
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role, 
      organization: role === "admin" ? organization.trim() : college.trim(),
      college: role === "admin" ? organization.trim() : college.trim(),
      branch: role === "admin" ? "Administration" : branch.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully! Redirecting...", { id: toastId });
        localStorage.setItem("isse_token", data.token);
        localStorage.setItem("isse_user", JSON.stringify(data));

        if (data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast.error(data.message || "Registration failed", { id: toastId });
      }
    } catch (error) {
      console.error("Registration submit error:", error);
      toast.error("Unable to connect to the server", { id: toastId });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 text-center">Create an Account</h1>
          <p className="text-sm text-slate-500 text-center mt-1">Register as a Student or College/Provider Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. admin@up.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 pr-10 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              <option value="student">Student</option>
              <option value="admin">College / Provider Admin</option>
            </select>
          </div>

          {/* DYNAMIC FORM FIELDS WITHOUT HARDCODED FALLBACKS */}
          {role === "admin" ? (
            <div className="bg-blue-50/50 p-4 border border-blue-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-blue-900 uppercase">
                Organization / College Authority Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UP Government, PSIT Kanpur, KIT Kanpur"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full p-2.5 text-sm border border-blue-300 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-blue-700 leading-tight">
                This establishes your multi-tenant scope.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">College Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PSIT Kanpur or KIT Kanpur"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Branch</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition cursor-pointer"
          >
            Register Account
          </button>
        </form>

        <p className="text-xs text-center text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;