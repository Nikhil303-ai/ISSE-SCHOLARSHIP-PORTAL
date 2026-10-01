import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";
import Chatbot from "../Chatbot";
import { API_BASE_URL } from "../api";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [savedScholarships, setSavedScholarships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Recommendation form state with College & Branch fields
  const [academicPercentage, setAcademicPercentage] = useState("82");
  const [annualFamilyIncome, setAnnualFamilyIncome] = useState("200000");
  const [college, setCollege] = useState("PSIT Kanpur");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [category, setCategory] = useState("General");
  const [state, setState] = useState("Uttar Pradesh");
  const [course, setCourse] = useState("B.Tech");
  const [currentYear, setCurrentYear] = useState("3rd Year");
  const [gender, setGender] = useState("Any");
  const [educationLevel, setEducationLevel] = useState("Undergraduate");

  // Document Upload state per application
  const [uploadState, setUploadState] = useState({});
  const [uploadingAppId, setUploadingAppId] = useState(null);

  // Notes state per application
  const [notesState, setNotesState] = useState({});

  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  const token = localStorage.getItem("isse_token");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const userData = localStorage.getItem("isse_user");
      const activeToken = localStorage.getItem("isse_token");

      if (!activeToken || !userData) {
        navigate("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === "admin") {
        navigate("/admin");
        return;
      }

      if (!cancelled) {
        setUser(parsedUser);
        if (parsedUser.college) setCollege(parsedUser.college);
        if (parsedUser.branch) setBranch(parsedUser.branch);
      }

      try {
        if (!cancelled) setLoading(true);

        const [savedRes, appsRes, notifRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/saved-scholarships`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
          fetch(`${API_BASE_URL}/api/applications`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
          fetch(`${API_BASE_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
        ]);

        const savedData = await savedRes.json();
        const appsData = await appsRes.json();
        const notifData = await notifRes.json();

        if (!cancelled) {
          if (savedRes.ok) setSavedScholarships(savedData.savedScholarships || []);
          if (appsRes.ok) {
            const appsList = appsData.applications || [];
            setApplications(appsList);

            const initialNotes = {};
            appsList.forEach((app) => {
              initialNotes[app._id] = app.notes || "";
            });
            setNotesState(initialNotes);
          }
          if (notifRes.ok) setNotifications(notifData.notifications || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Dashboard fetch error:", error);
          toast.error("Failed to load dashboard data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isse_token");
    localStorage.removeItem("isse_user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const refreshDashboardData = async () => {
    const activeToken = localStorage.getItem("isse_token");
    if (!activeToken) return;

    try {
      const [savedRes, appsRes, notifRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/saved-scholarships`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        fetch(`${API_BASE_URL}/api/applications`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
      ]);

      const savedData = await savedRes.json();
      const appsData = await appsRes.json();
      const notifData = await notifRes.json();

      if (savedRes.ok) setSavedScholarships(savedData.savedScholarships || []);
      if (appsRes.ok) {
        const appsList = appsData.applications || [];
        setApplications(appsList);

        const initialNotes = {};
        appsList.forEach((app) => {
          initialNotes[app._id] = app.notes || "";
        });
        setNotesState(initialNotes);
      }
      if (notifRes.ok) setNotifications(notifData.notifications || []);
    } catch (error) {
      console.error("Refresh dashboard error:", error);
    }
  };

  const handleSaveNotes = async (appId, currentStatus) => {
    const toastId = toast.loading("Saving notes...");
    const activeToken = localStorage.getItem("isse_token");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/applications/${appId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            status: currentStatus,
            notes: notesState[appId] || "",
          }),
        }
      );

      if (response.ok) {
        toast.success("Notes saved!", { id: toastId });
        refreshDashboardData();
      } else {
        toast.error("Failed to save notes", { id: toastId });
      }
    } catch (error) {
      console.error("Save notes error:", error);
      toast.error("Network error while saving notes", { id: toastId });
    }
  };

  const handleFileUpload = async (appId) => {
    const activeToken = localStorage.getItem("isse_token");
    const currentUpload = uploadState[appId];
    if (!currentUpload || !currentUpload.file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const toastId = toast.loading("Uploading document...");
    try {
      setUploadingAppId(appId);
      const formData = new FormData();
      formData.append("document", currentUpload.file);
      formData.append("name", currentUpload.name || "Verification Document");

      const response = await fetch(
        `${API_BASE_URL}/api/applications/${appId}/documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Document uploaded successfully!", { id: toastId });
        setUploadState((prev) => ({ ...prev, [appId]: { name: "", file: null } }));
        refreshDashboardData();
      } else {
        toast.error(data.message || "Failed to upload document.", { id: toastId });
      }
    } catch (error) {
      console.error("Document upload error:", error);
      toast.error("Error uploading document.", { id: toastId });
    }
    finally {
      setUploadingAppId(null);
    }
  };

  const handleDeleteDocument = async (appId, docId) => {
    const activeToken = localStorage.getItem("isse_token");
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    const toastId = toast.loading("Deleting document...");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/applications/${appId}/documents/${docId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Document deleted", { id: toastId });
        refreshDashboardData();
      } else {
        toast.error("Failed to delete document.", { id: toastId });
      }
    } catch (error) {
      console.error("Delete document error:", error);
      toast.error("Network error while deleting", { id: toastId });
    }
  };

  const handleGetRecommendations = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Fetching AI Recommendations...");
    try {
      setRecLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/recommendations/recommend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            academicPercentage: Number(academicPercentage) || 0,
            annualFamilyIncome: Number(annualFamilyIncome) || 0,
            college,
            branch,
            category,
            state,
            course,
            currentYear,
            gender,
            educationLevel,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setRecommendations(data.recommendations || []);
        toast.success(`Found ${data.recommendations?.length || 0} matches!`, { id: toastId });
      } else {
        toast.error("Failed to fetch recommendations", { id: toastId });
      }
    } catch (error) {
      console.error("Recommendation error:", error);
      toast.error("Error connecting to recommendation service", { id: toastId });
    } finally {
      setRecLoading(false);
    }
  };

  // Calculate Match Score Percentage
  const calculateMatchScore = (sch) => {
    let score = 72;
    const userPct = Number(academicPercentage) || 0;
    const userInc = Number(annualFamilyIncome) || 0;

    const reqPct = sch.eligibility?.minPercentage || sch.minAcademicPercentage || 0;
    const reqInc = sch.eligibility?.maxIncome || sch.maxAnnualIncome || 0;
    const targetCollege = sch.eligibility?.colleges?.[0] || sch.college || "Any";
    const targetBranch = sch.eligibility?.branches?.[0] || sch.branch || "Any";

    if (userPct >= reqPct && reqPct > 0) score += 12;
    if (userInc <= reqInc && reqInc > 0) score += 8;
    if (targetCollege === "Any" || targetCollege.toLowerCase() === college.toLowerCase()) score += 4;
    if (targetBranch === "Any" || targetBranch.toLowerCase() === branch.toLowerCase()) score += 2;

    return Math.min(score, 98);
  };

  // PDF Export Function
  const handleDownloadPDF = (app) => {
    const sch = app.scholarshipId || {};
    const refId = `ISSE-${app._id?.slice(-6).toUpperCase() || "2026-X89"}`;
    const dateStr = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : new Date().toLocaleDateString();

    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 30px; font-family: sans-serif; color: #1e293b; max-width: 700px; margin: auto; border: 2px solid #e2e8f0; border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h1 style="color: #2563eb; margin: 0; font-size: 22px; font-weight: 800;">ISSE SCHOLARSHIP RECEIPT</h1>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Integrated Student Success Ecosystem</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: bold; font-size: 13px; color: #0f172a;">REF ID: ${refId}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Date: ${dateStr}</p>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; font-size: 13px; color: #334155; text-transform: uppercase;">Applicant Profile</h3>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Name:</strong> ${user?.name || "Student"}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Email:</strong> ${user?.email || "N/A"}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>College:</strong> ${college}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Branch:</strong> ${branch}</p>
        </div>

        <div style="border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; font-size: 13px; color: #334155; text-transform: uppercase;">Scholarship Details</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #2563eb; font-weight: bold;">${sch.title || "Scholarship Program"}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Provider:</strong> ${sch.provider || "N/A"}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Award Value:</strong> ₹${sch.amount || "N/A"}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold; text-transform: uppercase;">${app.status || "APPLIED"}</span></p>
        </div>

        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">This is an official computer-generated summary receipt from ISSE Portal.</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `ISSE_Receipt_${refId}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
    toast.success("Downloading Application PDF Receipt!");
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      applied: { text: "APPLIED", style: "bg-blue-50 text-blue-700 border-blue-200" },
      under_review: { text: "UNDER REVIEW", style: "bg-purple-50 text-purple-700 border-purple-200" },
      documents_required: { text: "DOCUMENTS REQUIRED", style: "bg-amber-50 text-amber-700 border-amber-200" },
      approved: { text: "APPROVED", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      rejected: { text: "REJECTED", style: "bg-rose-50 text-rose-700 border-rose-200" },
      saved: { text: "SAVED", style: "bg-slate-50 text-slate-700 border-slate-200" },
    };

    const config = statusMap[status] || {
      text: status?.replaceAll("_", " ")?.toUpperCase() || "UNKNOWN",
      style: "bg-slate-50 text-slate-700 border-slate-200",
    };

    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${config.style}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Profile Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Logged in as: <span className="font-semibold text-slate-700">{user?.name || "Student"}</span> ({user?.email})</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition cursor-pointer self-start md:self-auto"
          >
            Logout
          </button>
        </div>

        {/* Notifications Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Notifications</h2>
          {notifications.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No notifications yet.</p>
          ) : (
            <div className="grid gap-3">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 rounded-xl border ${
                    notif.isRead
                      ? "bg-slate-50 border-slate-200"
                      : "bg-amber-50/60 border-amber-200"
                  }`}
                >
                  <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications & Verification Documents */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Application Tracking & Verification Documents</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-24 bg-slate-100 rounded-xl"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 text-sm">You are not tracking any scholarship applications yet.</p>
              <Link to="/scholarships" className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline">
                Browse Scholarships →
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {applications.map((app) => {
                const sch = app.scholarshipId;
                if (!sch) return null;

                return (
                  <div key={app._id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                    {/* Read-Only Status Badge for Students */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{sch.title}</h3>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(app.status)}
                        <button
                          onClick={() => handleDownloadPDF(app)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-200 transition cursor-pointer"
                        >
                          📄 PDF Receipt
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">Provider:</span> {sch.provider}
                    </p>

                    {/* Personal Notes */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={notesState[app._id] || ""}
                        onChange={(e) =>
                          setNotesState({ ...notesState, [app._id]: e.target.value })
                        }
                        placeholder="Add personal application notes..."
                        className="flex-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                      <button
                        onClick={() => handleSaveNotes(app._id, app.status)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                      >
                        Save Notes
                      </button>
                    </div>

                    {/* Uploaded Documents List */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded Verification Documents</h4>
                      {app.documents && app.documents.length > 0 ? (
                        <ul className="divide-y divide-slate-100 text-sm">
                          {app.documents.map((doc) => (
                            <li key={doc._id} className="py-2 flex items-center justify-between">
                              <span className="font-medium text-slate-700">{doc.name}</span>
                              <div className="flex items-center gap-3">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 font-semibold hover:underline"
                                >
                                  View File ↗
                                </a>
                                <button
                                  onClick={() => handleDeleteDocument(app._id, doc._id)}
                                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>
                      )}

                      {/* File Upload Controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
                        <select
                          value={uploadState[app._id]?.name || ""}
                          onChange={(e) =>
                            setUploadState({
                              ...uploadState,
                              [app._id]: { ...uploadState[app._id], name: e.target.value },
                            })
                          }
                          className="p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none"
                        >
                          <option value="">Select Document Type</option>
                          <option value="Income Certificate">Income Certificate</option>
                          <option value="Marksheet">Marksheet / Transcript</option>
                          <option value="Caste Certificate">Caste Certificate</option>
                          <option value="ID Proof">ID Proof</option>
                          <option value="Other">Other Document</option>
                        </select>

                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) =>
                            setUploadState({
                              ...uploadState,
                              [app._id]: {
                                ...uploadState[app._id],
                                file: e.target.files[0],
                              },
                            })
                          }
                          className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />

                        <button
                          onClick={() => handleFileUpload(app._id)}
                          disabled={uploadingAppId === app._id}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition cursor-pointer disabled:opacity-50"
                        >
                          {uploadingAppId === app._id ? "Uploading..." : "Upload Document"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Saved Scholarships */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Saved Scholarships</h2>
          {savedScholarships.length === 0 ? (
            <p className="text-slate-500 text-sm italic">You have not saved any scholarships yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {savedScholarships.map((saved) => (
                <div key={saved._id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50/50">
                  <h4 className="font-bold text-slate-900 text-sm">{saved.scholarshipId?.title || "Scholarship"}</h4>
                  <Link
                    to={`/scholarships/${saved.scholarshipId?._id || saved.scholarshipId?.id || saved.scholarshipId?.scholarshipId}`}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendations Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">AI Scholarship Recommendations</h2>
          <form onSubmit={handleGetRecommendations} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">College</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. PSIT Kanpur"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Computer Science & Engineering"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Academic %</label>
              <input
                type="number"
                value={academicPercentage}
                onChange={(e) => setAcademicPercentage(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. 85"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Family Income (₹)</label>
              <input
                type="number"
                value={annualFamilyIncome}
                onChange={(e) => setAnnualFamilyIncome(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. 250000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">State</label>
              <input
                type="text"
                value={state}
                placeholder="e.g. Uttar Pradesh"
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Course</label>
              <input
                type="text"
                value={course}
                placeholder="e.g. B.Tech"
                onChange={(e) => setCourse(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Year of Study</label>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Any">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Education Level</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Diploma">Diploma</option>
                <option value="School">School</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={recLoading}
              className="sm:col-span-2 lg:col-span-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition cursor-pointer"
            >
              {recLoading ? "Finding..." : "Get Recommendations"}
            </button>
          </form>

          {/* Matched Scholarships Output with Match Score % Badges */}
          {recommendations.length > 0 && (
            <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Matched Scholarships</h3>
              {recommendations.map((sch) => {
                const matchScore = calculateMatchScore(sch);
                const scholarshipId = sch._id || sch.id || sch.scholarshipId;

                return (
                  <div key={scholarshipId} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${matchScore >= 90 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                          ⚡ {matchScore}% Match
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{sch.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">{sch.description}</p>
                    </div>
                    <Link
                      to={`/scholarships/${scholarshipId}`}
                      className="shrink-0 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating RAG Chatbot Widget */}
        <Chatbot />
      </div>
    </div>
  );
}

export default Dashboard;