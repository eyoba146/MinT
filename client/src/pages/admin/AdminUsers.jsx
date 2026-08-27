import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StatCard from "../../components/StatCard";
import Modal from "../../components/ui/Modal";
import {
  Users,
  Search,
  Loader2,
  UserCircle,
  Building2,
  Briefcase,
  Shield,
  Trash2,
  ClipboardList,
  Megaphone,
} from "lucide-react";

const ROLE_TABS = [
  { key: "all", label: "All" },
  { key: "citizen", label: "Citizens" },
  { key: "reviewer", label: "Reviewers" },
  { key: "moderator", label: "Moderators" },
  { key: "founder", label: "Founders" },
  { key: "investor", label: "Investors" },
  { key: "ecosystem_builder", label: "Builders" },
  { key: "admin", label: "Admins" },
];

// Only these can be assigned (never admin / founder / investor / builder)
const ASSIGNABLE = ["reviewer", "moderator", "citizen"];

// Only these current roles show "Assign staff role"
const CAN_CHANGE_ROLE = ["citizen", "reviewer", "moderator"];

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [roleCounts, setRoleCounts] = useState({
    total: 0,
    founder: 0,
    investor: 0,
    admin: 0,
    citizen: 0,
    ecosystem_builder: 0,
    reviewer: 0,
    moderator: 0,
  });
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState("reviewer");
  const [savingRole, setSavingRole] = useState(false);

  const fetchUsers = async (selectedRole = role, q = search) => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRole && selectedRole !== "all") params.set("role", selectedRole);
      if (q?.trim()) params.set("search", q.trim());
      const res = await apiRequest(`/users?${params.toString()}`);
      setUsers(res.data || []);
      if (res.roleCounts) setRoleCounts(res.roleCounts);
    } catch (err) {
      toast(err.message || "Failed to load users", "error");
      setUsers([]);
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers("all", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) fetchUsers(role, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const id = deleteTarget.id || deleteTarget._id;
      await apiRequest(`/users/${id}`, { method: "DELETE" });
      toast("User deleted", "success");
      setDeleteTarget(null);
      await fetchUsers(role, search);
    } catch (err) {
      toast(err.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  const confirmRoleChange = async () => {
    if (!roleTarget) return;
    setSavingRole(true);
    try {
      const id = roleTarget.id || roleTarget._id;
      await apiRequest(`/users/${id}/role`, {
        method: "PATCH",
        body: { role: newRole },
      });
      toast(`Role set to ${newRole}`, "success");
      setRoleTarget(null);
      await fetchUsers(role, search);
    } catch (err) {
      toast(err.message || "Role update failed", "error");
    } finally {
      setSavingRole(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Users">
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Users" subtitle={`Staff assignment · ${user?.fullName || "admin"}`}>
      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <strong>Staff only:</strong> promote a <strong>citizen</strong> to{" "}
        <strong>reviewer</strong> or <strong>moderator</strong>, or demote staff back to{" "}
        <strong>citizen</strong>. Founders, investors, and builders keep their registration
        role. Admin is not assignable here.
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={roleCounts.total} icon={Users} color="blue" />
        <StatCard
          label="Reviewers"
          value={roleCounts.reviewer || 0}
          icon={ClipboardList}
          color="amber"
        />
        <StatCard
          label="Moderators"
          value={roleCounts.moderator || 0}
          icon={Megaphone}
          color="teal"
        />
        <StatCard label="Admins" value={roleCounts.admin || 0} icon={Shield} color="purple" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6 pt-4 border-b border-slate-100 flex flex-wrap gap-1">
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRole(t.key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
                role === t.key
                  ? "text-teal-800 border-b-2 border-teal-600 bg-teal-50/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers(role, search);
          }}
          className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl"
          >
            Search
          </button>
        </form>

        {listLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <UserCircle className="mx-auto text-slate-300 mb-3" size={28} />
            <p className="text-sm font-medium text-slate-700">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => {
              const uid = u.id || u._id;
              const isSelf = uid === user?.id || uid === user?._id;
              const canAssignStaff = CAN_CHANGE_ROLE.includes(u.role) && !isSelf;

              return (
                <div
                  key={uid}
                  className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-semibold text-sm shrink-0">
                    {(u.fullName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{u.fullName}</span>
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-full border border-slate-200 text-slate-600 capitalize">
                        {u.role?.replace("_", " ")}
                      </span>
                      {isSelf && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canAssignStaff && (
                      <button
                        type="button"
                        onClick={() => {
                          setRoleTarget(u);
                          setNewRole(
                            ASSIGNABLE.includes(u.role) ? u.role : "reviewer"
                          );
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg"
                      >
                        <Shield size={13} /> Assign staff role
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => setDeleteTarget(u)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-40"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!roleTarget}
        onClose={() => !savingRole && setRoleTarget(null)}
        title="Assign staff role"
        footer={
          <>
            <button
              onClick={() => setRoleTarget(null)}
              disabled={savingRole}
              className="px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmRoleChange}
              disabled={savingRole}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-teal-600"
            >
              {savingRole ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          <strong>{roleTarget?.fullName}</strong> ({roleTarget?.email})
          <br />
          <span className="text-xs text-slate-500">
            Current: {roleTarget?.role}. Options: reviewer, moderator, or citizen only.
          </span>
        </p>
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
        >
          <option value="reviewer">reviewer — designation case evaluation</option>
          <option value="moderator">moderator — opportunities officer</option>
          <option value="citizen">citizen — remove staff access</option>
        </select>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete user?"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-red-600"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <strong>{deleteTarget?.fullName}</strong> ({deleteTarget?.role})?
        </p>
      </Modal>
    </AppShell>
  );
}