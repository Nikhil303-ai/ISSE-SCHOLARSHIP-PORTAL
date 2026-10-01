import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getRecommendations } from "../services/aiService";

function Recommendations() {
  const [formData, setFormData] = useState({
    percentage: "",
    income: "",
    category: "General",
    state: "",
    course: "",
    year: "",
    gender: "Any",
    educationLevel: "Undergraduate",
    board: "",
    class12Percentile: "",
  });

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Finding matching scholarships...");

    try {
      const profile = {
        percentage: Number(formData.percentage),
        income: Number(formData.income),
        category: formData.category,
        state: formData.state,
        course: formData.course,
        year: Number(formData.year),
        gender: formData.gender,
        educationLevel: formData.educationLevel,
        board: formData.board || null,
        class12Percentile:
          formData.class12Percentile === ""
            ? null
            : Number(formData.class12Percentile),
      };

      const data = await getRecommendations(profile);
      const list = data.recommendations || [];
      setRecommendations(list);
      toast.success(`Found ${list.length} scholarship match(es)!`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Unable to get recommendations. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">AI Scholarship Recommendations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your academic and financial profile to calculate exact eligibility match scores.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Percentage %</label>
            <input
              type="number"
              name="percentage"
              value={formData.percentage}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              placeholder="e.g. 82.5"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Annual Family Income (₹)</label>
            <input
              type="number"
              name="income"
              value={formData.income}
              onChange={handleChange}
              min="0"
              placeholder="e.g. 250000"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="e.g. Uttar Pradesh"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Course</label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleChange}
              placeholder="e.g. B.Tech"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Year of Study</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1"
              max="6"
              placeholder="e.g. 1"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="Any">Prefer not to specify</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Class 12 Board</label>
            <select
              name="board"
              value={formData.board}
              onChange={handleChange}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">Select Board</option>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="UP Board">UP Board</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Class 12 Percentile</label>
            <input
              type="number"
              name="class12Percentile"
              value={formData.class12Percentile}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              placeholder="Optional"
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-2 md:col-span-3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Finding Scholarships..." : "Find Scholarships"}
          </button>
        </form>

        {/* Results List */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Recommended Scholarships ({recommendations.length})
            </h2>
            {recommendations.map((scholarship) => (
              <div
                key={scholarship.scholarshipId}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{scholarship.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">Provider: {scholarship.provider}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full self-start sm:self-auto">
                    Match Score: {scholarship.score}/100
                  </span>
                </div>

                <p className="text-xs text-slate-600"><span className="font-semibold text-slate-700">Eligibility:</span> {scholarship.eligibility}</p>

                {scholarship.reasons?.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block uppercase">Match Reasoning:</span>
                    <ul className="list-disc list-inside text-slate-600">
                      {scholarship.reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">
                    Deadline: {scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString() : "Not specified"}
                  </span>
                  <Link
                    to={`/scholarships/${scholarship.scholarshipId}`}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View Scholarship Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Recommendations;