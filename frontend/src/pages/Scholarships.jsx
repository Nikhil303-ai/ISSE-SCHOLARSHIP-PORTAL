import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../api";

function Scholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [course, setCourse] = useState("");
  const [gender, setGender] = useState("");
  const [maxIncome, setMaxIncome] = useState("");
  const [minPercentage, setMinPercentage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchScholarships = useCallback(
    async (event) => {
      if (event) event.preventDefault();
      setLoading(true);

      try {
        const params = new URLSearchParams();

        if (search.trim()) params.set("search", search.trim());
        if (category) params.set("category", category);
        if (state.trim()) params.set("state", state.trim());
        if (course.trim()) params.set("course", course.trim());
        if (gender) params.set("gender", gender);
        if (maxIncome !== "") params.set("maxIncome", maxIncome);
        if (minPercentage !== "") params.set("minPercentage", minPercentage);

        const query = params.toString();
        const response = await fetch(
          `${API_BASE_URL}/api/scholarships${query ? `?${query}` : ""}`
        );
        const data = await response.json();

        if (!response.ok) {
          setScholarships([]);
          const errorMsg = data.message || "Unable to fetch scholarships";
          toast.error(errorMsg);
          return;
        }

        const list = data.scholarships || data || [];
        setScholarships(list);
        if (event) {
          toast.success(`Found ${list.length} scholarship(s)`);
        }
      } catch (error) {
        console.error("Scholarship fetch error:", error);
        setScholarships([]);
        toast.error("Unable to connect to the server");
      } finally {
        setLoading(false);
      }
    },
    [search, category, state, course, gender, maxIncome, minPercentage]
  );

  useEffect(() => {
    let cancelled = false;

    const loadInitialScholarships = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/scholarships`);
        const data = await response.json();

        if (!cancelled) {
          if (!response.ok) {
            setScholarships([]);
          } else {
            setScholarships(data.scholarships || data || []);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Scholarship fetch error:", error);
          setScholarships([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialScholarships();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearFilters = async () => {
    setSearch("");
    setCategory("");
    setState("");
    setCourse("");
    setGender("");
    setMaxIncome("");
    setMinPercentage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scholarships`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch scholarships");
      }

      setScholarships(data.scholarships || data || []);
      toast.success("Filters cleared");
    } catch (error) {
      console.error("Scholarship fetch error:", error);
      setScholarships([]);
      toast.error("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Explore Scholarships</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse available financial opportunities and filter by your qualification parameters.
          </p>
        </div>

        {/* Filter Controls Form */}
        <form
          onSubmit={fetchScholarships}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search title or provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">All Categories</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">Any Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              State
            </label>
            <input
              type="text"
              placeholder="e.g. Uttar Pradesh"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Course
            </label>
            <input
              type="text"
              placeholder="e.g. B.Tech"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Max Income (₹)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 300000"
              value={maxIncome}
              onChange={(e) => setMaxIncome(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Min Academic %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 60"
              value={minPercentage}
              onChange={(e) => setMinPercentage(e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition cursor-pointer"
            >
              Apply Search & Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Scholarships List */}
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-28 bg-white border border-slate-200 rounded-2xl"></div>
              <div className="h-28 bg-white border border-slate-200 rounded-2xl"></div>
            </div>
          ) : scholarships.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <p className="text-slate-500 text-sm">No scholarships match your filter criteria.</p>
            </div>
          ) : (
            scholarships.map((scholarship) => (
              <div
                key={scholarship._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900">{scholarship.title}</h2>
                  <p className="text-sm font-medium text-slate-500">
                    Provider: <span className="text-slate-700">{scholarship.provider}</span>
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2 pt-1">
                    {scholarship.description}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 pt-2">
                    Deadline:{" "}
                    {scholarship.deadline
                      ? new Date(scholarship.deadline).toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>

                <Link
                  to={`/scholarships/${scholarship._id}`}
                  className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl text-center shadow-sm transition"
                >
                  View Details →
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Scholarships;