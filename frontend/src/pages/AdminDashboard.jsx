import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [adminUser] = useState(() => {
    const userData = localStorage.getItem("isse_user");
    return userData ? JSON.parse(userData) : null;
  });

  const adminOrg = adminUser?.organization || adminUser?.college || "General Provider";

  const [applications, setApplications] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Extractor state
  const [rawText, setRawText] = useState("");
  const [extracting, setExtracting] = useState(false);

  const [newScholarship, setNewScholarship] = useState({
    title: "",
    provider: adminOrg,
    description: "",
    amount: "",
    category: "General",
    minAcademicPercentage: "",
    maxAnnualIncome: "",
    college: adminOrg,
    branch: "Any",
    state: "Uttar Pradesh",
    course: "B.Tech",
    deadline: "",
  });

  // Isolated Refresh Function: Strictly fetches Admin-Scoped Data
  const refreshData = async () => {
    try {
      const activeToken = localStorage.getItem("isse_token");
      if (!activeToken) return;

      const [appsRes, schRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/applications`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/scholarships`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
      ]);

      const appsData = await appsRes.json();
      const schData = await schRes.json();

      if (appsRes.ok) setApplications(appsData.applications || []);
      if (schRes.ok) setScholarships(schData.scholarships || []);
    } catch (error) {
      console.error("Error refreshing admin data:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("isse_token");

    if (!token || !adminUser) {
      toast.error("Please log in to access the portal.");
      navigate("/login");
      return;
    }

    if (adminUser.role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const activeToken = localStorage.getItem("isse_token");
        const [appsRes, schRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/applications`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
          fetch(`${API_BASE_URL}/api/admin/scholarships`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
        ]);

        const appsData = await appsRes.json();
        const schData = await schRes.json();

        if (appsRes.ok) setApplications(appsData.applications || []);
        if (schRes.ok) setScholarships(schData.scholarships || []);
      } catch (error) {
        console.error("Error loading admin data:", error);
        toast.error("Failed to load admin management data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adminUser, navigate]);

  // AI Auto-Extractor Handler
  const handleAIExtract = async () => {
    if (!rawText.trim()) {
      toast.error("Please paste scholarship announcement text or notice.");
      return;
    }

    const toastId = toast.loading("AI parsing notice details...");
    setExtracting(true);

    try {
      const activeToken = localStorage.getItem("isse_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/extract-scholarship`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ rawText }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const ext = result.data;
        setNewScholarship((prev) => ({
          ...prev,
          title: ext.title || prev.title,
          provider: adminOrg, // Keep scoped to current logged-in admin org
          amount: ext.amount || prev.amount,
          description: ext.description || prev.description,
          minAcademicPercentage: ext.minAcademicPercentage || prev.minAcademicPercentage,
          maxAnnualIncome: ext.maxAnnualIncome || prev.maxAnnualIncome,
          college: ext.college || adminOrg,
          branch: ext.branch || prev.branch,
          category: ext.category || prev.category,
          deadline: ext.deadline || prev.deadline,
        }));
        toast.success("Details extracted! Review & publish below.", { id: toastId });
      } else {
        toast.error(result.message || "Extraction failed.", { id: toastId });
      }
    } catch (error) {
      console.error("AI Extractor Error:", error);
      toast.error("Error connecting to AI extractor service.", { id: toastId });
    } finally {
      setExtracting(false);
    }
  };

  const handleUpdateAppStatus = async (appId, status, notes) => {
    const toastId = toast.loading("Updating application status...");
    try {
      const activeToken = localStorage.getItem("isse_token");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/applications/${appId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({ status, notes }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Application status updated & student notified via email!", { id: toastId });
        refreshData();
      } else {
        toast.error(data.message || "Failed to update status", { id: toastId });
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Network error while updating status", { id: toastId });
    }
  };

  const handleCreateScholarship = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Adding scholarship & syncing AI Vector Store...");

    try {
      const activeToken = localStorage.getItem("isse_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/scholarships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          ...newScholarship,
          provider: adminOrg,
          amount: Number(newScholarship.amount) || 0,
          minAcademicPercentage: Number(newScholarship.minAcademicPercentage) || 0,
          maxAnnualIncome: Number(newScholarship.maxAnnualIncome) || 0,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Scholarship published and AI Vector Store synced!", { id: toastId });
        setNewScholarship({
          title: "",
          provider: adminOrg,
          description: "",
          amount: "",
          category: "General",
          minAcademicPercentage: "",
          maxAnnualIncome: "",
          college: adminOrg,
          branch: "Any",
          state: "Uttar Pradesh",
          course: "B.Tech",
          deadline: "",
        });
        setRawText("");
        refreshData();
      } else {
        toast.error(data.message || "Failed to create scholarship", { id: toastId });
      }
    } catch (error) {
      console.error("Create scholarship error:", error);
      toast.error("Error creating scholarship", { id: toastId });
    }
  };

  const handleDeleteScholarship = async (schId) => {
    if (!window.confirm("Are you sure you want to delete this scholarship?")) return;

    const toastId = toast.loading("Deleting scholarship & updating Vector Store...");

    try {
      const activeToken = localStorage.getItem("isse_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/scholarships/${schId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (response.ok) {
        toast.success("Scholarship deleted and Vector Store updated!", { id: toastId });
        refreshData();
      } else {
        toast.error("Failed to delete scholarship.", { id: toastId });
      }
    } catch (error) {
      console.error("Delete scholarship error:", error);
      toast.error("Error deleting scholarship.", { id: toastId });
    }
  };

  // Metrics Calculation
  const totalApps = applications.length;
  const pendingApps = applications.filter((a) => a.status === "applied" || a.status === "under_review").length;
  const approvedApps = applications.filter((a) => a.status === "approved").length;
  const totalScholarshipsCount = scholarships.length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin & Provider Portal</h1>
            <p className="text-sm text-slate-500 mt-1">
              Isolated Provider Scope: <span className="font-bold text-blue-600">{adminOrg}</span>
            </p>
          </div>
          <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 block">
              Logged in as
            </span>
            <span className="text-sm font-bold text-slate-800">{adminUser?.name || "Admin"}</span>
          </div>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Assigned Submissions</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalApps}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">Pending Review</span>
            <p className="text-2xl font-extrabold text-purple-700 mt-1">{pendingApps}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Approved Grants</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{approvedApps}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Managed Listings</span>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">{totalScholarshipsCount}</p>
          </div>
        </div>

        {/* AI AUTO-EXTRACTOR BOX */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full text-xs font-bold">
              AI Powered Feature
            </span>
            <h2 className="text-lg font-bold">1-Click AI Scholarship Notice Extractor</h2>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed">
            Paste raw announcement text or circular details below. AI will instantly parse the title, eligibility criteria, award amount, college, and branch requirements into the form fields below!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`e.g., ${adminOrg} Notice: Applications invited for Merit Excellence Award 2026...`}
              className="flex-1 p-3 text-xs bg-white/10 text-white placeholder-blue-200/60 border border-blue-300/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={handleAIExtract}
              disabled={extracting}
              className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer self-stretch sm:self-auto shrink-0 disabled:opacity-50"
            >
              {extracting ? "Extracting..." : "⚡ AI Extract & Pre-fill"}
            </button>
          </div>
        </div>

        {/* Section 1: Review Applications (Filtered to Admin Organization) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Student Applications Review ({adminOrg})
          </h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-20 bg-slate-100 rounded-xl"></div>
            </div>
          ) : applications.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No student applications submitted for this organization yet.</p>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => {
                const student = app.userId;
                const sch = app.scholarshipId;

                return (
                  <div key={app._id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        {sch?.title || "Scholarship Application"}
                      </h3>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-500">Status:</label>
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateAppStatus(app._id, e.target.value, app.notes)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-blue-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="saved">SAVED</option>
                          <option value="documents_required">DOCUMENTS REQUIRED</option>
                          <option value="applied">APPLIED</option>
                          <option value="under_review">UNDER REVIEW</option>
                          <option value="approved">APPROVED</option>
                          <option value="rejected">REJECTED</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">Student:</span>{" "}
                      {student?.name || "N/A"} ({student?.email}) |{" "}
                      <span className="font-semibold text-slate-700">College:</span> {student?.college || "N/A"} |{" "}
                      <span className="font-semibold text-slate-700">Branch:</span> {student?.branch || "N/A"}
                    </p>

                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Attached Verification Documents
                      </h4>
                      {app.documents && app.documents.length > 0 ? (
                        <ul className="divide-y divide-slate-100 text-sm">
                          {app.documents.map((doc) => (
                            <li key={doc._id} className="py-2 flex items-center justify-between">
                              <span className="font-medium text-slate-700">{doc.name}</span>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 font-semibold hover:underline"
                              >
                                View File ↗
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No verification documents attached by student.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Create Scholarship Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Publish Scholarship & Sync AI Vector Store
          </h2>
          <form onSubmit={handleCreateScholarship} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Scholarship Title</label>
              <input
                type="text"
                placeholder="Scholarship Title"
                value={newScholarship.title}
                onChange={(e) => setNewScholarship({ ...newScholarship, title: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Provider Name</label>
              <input
                type="text"
                disabled
                value={adminOrg}
                className="w-full p-2.5 text-sm border border-slate-200 bg-slate-100 font-bold text-slate-700 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Award Amount (₹)</label>
              <input
                type="number"
                placeholder="Award Amount (₹)"
                value={newScholarship.amount}
                onChange={(e) => setNewScholarship({ ...newScholarship, amount: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Deadline</label>
              <input
                type="date"
                value={newScholarship.deadline}
                onChange={(e) => setNewScholarship({ ...newScholarship, deadline: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target College</label>
              <input
                type="text"
                placeholder="e.g. PSIT Kanpur or Any"
                value={newScholarship.college}
                onChange={(e) => setNewScholarship({ ...newScholarship, college: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Branch</label>
              <input
                type="text"
                placeholder="e.g. Computer Science & Engineering or Any"
                value={newScholarship.branch}
                onChange={(e) => setNewScholarship({ ...newScholarship, branch: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Min Academic %</label>
              <input
                type="number"
                placeholder="Min Academic %"
                value={newScholarship.minAcademicPercentage}
                onChange={(e) => setNewScholarship({ ...newScholarship, minAcademicPercentage: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Max Annual Family Income (₹)</label>
              <input
                type="number"
                placeholder="Max Annual Family Income (₹)"
                value={newScholarship.maxAnnualIncome}
                onChange={(e) => setNewScholarship({ ...newScholarship, maxAnnualIncome: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Description & Eligibility Details</label>
              <textarea
                placeholder="Full Description & Eligibility Details..."
                value={newScholarship.description}
                onChange={(e) => setNewScholarship({ ...newScholarship, description: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="sm:col-span-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition cursor-pointer"
            >
              Publish Scholarship & Sync AI Vector Store
            </button>
          </form>
        </div>

        {/* Section 3: Existing Scholarships (Filtered to Logged-in Admin Organization) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Existing Scholarships ({scholarships.length})
          </h2>
          {scholarships.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No scholarships published by {adminOrg} yet.</p>
          ) : (
            <div className="grid gap-3">
              {scholarships.map((sch) => (
                <div
                  key={sch._id}
                  className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{sch.title}</h4>
                    <p className="text-xs text-slate-500">
                      Provider: {sch.provider} | Target: {sch.eligibility?.colleges?.[0] || "Any"} ({sch.eligibility?.branches?.[0] || "Any"}) | Award: ₹{sch.amount}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteScholarship(sch._id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs rounded-lg border border-rose-200 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;