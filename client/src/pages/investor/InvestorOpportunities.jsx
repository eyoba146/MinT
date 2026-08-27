import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import { Loader2, Plus, Megaphone, Briefcase } from "lucide-react";

const emptyForm = {
  title: "",
  description: "",
  type: "internship",
  deadline: "",
  link: "",
  location: "",
};

export default function InvestorOpportunities() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/opportunities/my");
      setItems(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/opportunities", {
        method: "POST",
        body: { ...form, deadline: form.deadline || undefined },
      });
      toast("Submitted for MinT approval", "success");
      setForm(emptyForm);
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to submit");
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Jobs & internships"
      subtitle="Posts become public after MinT approval"
      actions={
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl"
        >
          <Plus size={16} /> New post
        </button>
      }
    >
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 max-w-2xl"
        >
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Briefcase size={18} /> Submit offer
          </h2>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="internship">Internship</option>
            <option value="job">Job</option>
          </select>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Location"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <input
            type="url"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
            >
              {saving ? "Submitting…" : "Submit for approval"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <h2 className="text-sm font-semibold text-slate-700 mb-3">My submissions</h2>
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
          <Megaphone className="mx-auto text-slate-300 mb-3" size={26} />
          <p className="text-sm font-medium text-slate-700">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                  {item.type}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    item.status === "approved"
                      ? "bg-teal-50 text-teal-700"
                      : item.status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}