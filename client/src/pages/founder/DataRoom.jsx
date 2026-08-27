import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import Modal from "../../components/ui/Modal";
import {
  ArrowLeft,
  Loader2,
  Upload,
  FileText,
  Trash2,
  Download,
} from "lucide-react";

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DataRoom() {
  const { toast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await apiRequest("/documents/my");
      setDocs(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError("Title and file are required");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("file", file);
      await apiRequest("/documents", { method: "POST", body: formData });
      setTitle("");
      setFile(null);
      const input = document.getElementById("data-room-file");
      if (input) input.value = "";
      toast("Document uploaded", "success");
      await fetchDocs();
    } catch (err) {
      setError(err.message);
      toast(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const blob = await apiRequest(`/documents/${doc._id}/download`, { blob: true });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalName || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast(err.message || "Download failed", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiRequest(`/documents/${deleteId}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d._id !== deleteId));
      toast("Document deleted", "success");
      setDeleteId(null);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Data room">
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Secure data room"
      subtitle="Only investors you approve can download these files"
      actions={
        <Link
          to="/founder"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      }
    >
      <form
        onSubmit={handleUpload}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 space-y-4 max-w-3xl"
      >
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Upload size={18} /> Upload document
        </h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pitch Deck, Financial Projections"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            File * (PDF, Word, Excel, PPT, images — max 10MB)
          </label>
          <input
            id="data-room-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-800 file:font-medium"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
        )}
        <button
          type="submit"
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold rounded-xl"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload size={16} /> Upload
            </>
          )}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-3xl">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Documents ({docs.length})</h2>
        </div>
        {docs.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm text-slate-600 font-medium">No documents yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {docs.map((doc) => (
              <div
                key={doc._id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-teal-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{doc.title}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {doc.originalName} · {formatSize(doc.size)} ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg"
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(doc._id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        title="Delete document?"
        footer={
          <>
            <button
              onClick={() => setDeleteId(null)}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">This cannot be undone.</p>
      </Modal>
    </AppShell>
  );
}