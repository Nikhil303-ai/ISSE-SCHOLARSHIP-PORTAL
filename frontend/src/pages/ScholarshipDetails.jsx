import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../api";

function ScholarshipDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);

  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [userDocs, setUserDocs] = useState([]);

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/scholarships/${id}`);
        const data = await response.json();

        if (response.ok) {
          setScholarship(data.scholarship || data);
        } else {
          toast.error(data.message || "Scholarship not found");
        }
      } catch (error) {
        console.error("Fetch scholarship error:", error);
        toast.error("Unable to connect to the server");
      } finally {
        setLoading(false);
      }
    };

    fetchScholarship();
  }, [id]);

  // AI Match Score Calculation Logic
  const getMatchScore = () => {
    if (!user || !scholarship) return null;
    let score = 100;

    const minMarks =
      scholarship.eligibility?.minPercentage ?? scholarship.minAcademicPercentage ?? 0;
    const maxIncome =
      scholarship.eligibility?.maxIncome ?? scholarship.maxAnnualIncome ?? Infinity;

    if (user.academicPercentage !== undefined && user.academicPercentage < minMarks) {
      score -= 35;
    }
    if (user.annualIncome !== undefined && maxIncome > 0 && user.annualIncome > maxIncome) {
      score -= 35;
    }
    if (
      user.category &&
      scholarship.category &&
      scholarship.category !== "Any" &&
      scholarship.category !== "General" &&
      user.category !== scholarship.category
    ) {
      score -= 15;
    }
    if (
      user.college &&
      scholarship.provider &&
      scholarship.provider !== "General" &&
      scholarship.provider.toLowerCase().trim() !== user.college.toLowerCase().trim()
    ) {
      score -= 15;
    }

    return Math.max(score, 0);
  };

  const matchScore = getMatchScore();

  const handleSave = async () => {
    const toastId = toast.loading("Saving scholarship...");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("isse_token");

      const response = await fetch(`${API_BASE_URL}/api/saved-scholarships/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Scholarship saved successfully!", { id: toastId });
      } else {
        toast.error(data.message || "Unable to save scholarship", { id: toastId });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Unable to connect to the server", { id: toastId });
    }
  };

  const handleAddUserDoc = (e) => {
    e.preventDefault();
    if (!docName.trim() || !docUrl.trim()) {
      toast.error("Please enter both document name and URL.");
      return;
    }

    setUserDocs([...userDocs, { name: docName, url: docUrl }]);
    setDocName("");
    setDocUrl("");
    toast.success("Document attached!");
  };

  const handleTrackApplication = async () => {
    const toastId = toast.loading("Checking eligibility & submitting...");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("isse_token");

      const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scholarshipId: id,
          documents: userDocs,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Application tracking started successfully!", { id: toastId });
      } else {
        // Displays eligibility rejection error reason
        toast.error(data.message || "Unable to start application tracking", {
          id: toastId,
          duration: 6000,
        });
      }
    } catch (error) {
      console.error("Application submission error:", error);
      toast.error("Unable to connect to the server", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-slate-500 font-medium">Loading details...</div>
    );
  }

  if (!scholarship) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/scholarships"
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Scholarships
        </Link>

        {/* Main Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {scholarship.title}
                </h1>

                {/* AI Match Score Badge */}
                {matchScore !== null && (
                  <span
                    className={`px-3 py-1 text-xs font-extrabold rounded-full border shadow-xs ${
                      matchScore >= 80
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : matchScore >= 50
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    ⚡ {matchScore}% AI Match
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Provider:{" "}
                <span className="font-semibold text-slate-700">{scholarship.provider}</span>
              </p>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleSave}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition cursor-pointer"
                >
                  Save Scholarship
                </button>
                <button
                  onClick={handleTrackApplication}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition cursor-pointer"
                >
                  Submit & Track Application
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                <Link to="/login" className="text-blue-600 font-semibold underline">
                  Login
                </Link>{" "}
                to save or track this scholarship.
              </p>
            )}
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Description
            </h2>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {scholarship.description}
            </p>
          </div>

          {/* Eligibility Requirements Cards */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Eligibility Requirements
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-xs font-semibold text-slate-400 block uppercase">
                  Min Marks
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {scholarship.eligibility?.minPercentage ??
                    scholarship.minAcademicPercentage ??
                    "Not specified"}
                  %
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-xs font-semibold text-slate-400 block uppercase">
                  Max Family Income
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {scholarship.eligibility?.maxIncome || scholarship.maxAnnualIncome
                    ? `₹${scholarship.eligibility?.maxIncome || scholarship.maxAnnualIncome}`
                    : "Not specified"}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-xs font-semibold text-slate-400 block uppercase">
                  Category
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {scholarship.eligibility?.categories?.length > 0
                    ? scholarship.eligibility.categories.join(", ")
                    : scholarship.category || "Not specified"}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-xs font-semibold text-slate-400 block uppercase">
                  States
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {scholarship.eligibility?.states?.length > 0
                    ? scholarship.eligibility.states.join(", ")
                    : scholarship.state || "Not specified"}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-xs font-semibold text-slate-400 block uppercase">
                  Courses
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {scholarship.eligibility?.courses?.length > 0
                    ? scholarship.eligibility.courses.join(", ")
                    : scholarship.course || "Not specified"}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-xs font-semibold text-slate-400 block uppercase">
                  Deadline
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {scholarship.deadline
                    ? new Date(scholarship.deadline).toLocaleDateString()
                    : "Not specified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Attachment Form */}
        {isLoggedIn && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Attach Verification Documents for Admin Review
            </h3>
            <form onSubmit={handleAddUserDoc} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Document Title (e.g. Income Cert, Marksheet)"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="flex-1 p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="url"
                placeholder="Document URL (e.g., Google Drive link)"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                className="flex-1 sm:flex-auto p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition cursor-pointer"
              >
                Attach
              </button>
            </form>

            {userDocs.length > 0 && (
              <ul className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm">
                {userDocs.map((doc, idx) => (
                  <li key={idx} className="py-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{doc.name}</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View Attached Link ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScholarshipDetails;