import { useMemo, useState } from "react";
import {
  Users, UserPlus, Search, ShieldCheck, UserCheck, UserX,
  MoreHorizontal, Pencil, Trash2, Eye, X, Mail, Phone,
  ChevronLeft, ChevronRight, Filter, Download
} from "lucide-react";

const initialUsers = [
  { id: 1, name: "Chandra Nath", email: "chandra@stockflow.demo", phone: "+91 98765 43210", role: "Admin", status: "Active", joined: "Jan 10, 2026" },
  { id: 2, name: "Demo Manager", email: "manager@stockflow.demo", phone: "+91 98765 43211", role: "Manager", status: "Active", joined: "Jan 12, 2026" },
  { id: 3, name: "Rahul Sharma", email: "rahul@stockflow.demo", phone: "+91 98765 43212", role: "Staff", status: "Active", joined: "Jan 14, 2026" },
  { id: 4, name: "Priya Das", email: "priya@stockflow.demo", phone: "+91 98765 43213", role: "Staff", status: "Inactive", joined: "Jan 15, 2026" },
  { id: 5, name: "Amit Verma", email: "amit@stockflow.demo", phone: "+91 98765 43214", role: "Manager", status: "Active", joined: "Jan 18, 2026" },
];

const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 dark:border-slate-700 dark:bg-[#0a1230] dark:text-white";
const panelClass = "rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-indigo-900 dark:bg-[#0c1230]";

function StatCard({ icon: Icon, label, value, note, tone }) {
  const tones = {
    purple: "border-purple-200 from-purple-50 to-fuchsia-100 dark:border-purple-700/60 dark:from-purple-950/80 dark:to-fuchsia-950/40 text-purple-600 dark:text-purple-300",
    blue: "border-blue-200 from-blue-50 to-cyan-100 dark:border-blue-700/60 dark:from-blue-950/80 dark:to-cyan-950/40 text-blue-600 dark:text-blue-300",
    green: "border-green-200 from-green-50 to-emerald-100 dark:border-green-700/60 dark:from-green-950/80 dark:to-emerald-950/40 text-green-600 dark:text-green-300",
    amber: "border-amber-200 from-amber-50 to-orange-100 dark:border-amber-700/60 dark:from-amber-950/80 dark:to-orange-950/40 text-amber-600 dark:text-amber-300",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{note}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3 dark:bg-black/20"><Icon size={25} /></div>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user || {
    name: "", email: "", phone: "", role: "Staff", status: "Active",
    joined: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
  });
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = e => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    onSave({ ...form, id: user?.id ?? Date.now() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-purple-200 bg-white p-5 shadow-2xl dark:border-indigo-800 dark:bg-[#101936]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{user ? "Edit User" : "Add New User"}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter the user's account details.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 sm:col-span-2">Full Name
            <input required value={form.name} onChange={e => set("name", e.target.value)} className={`${inputClass} mt-2`} placeholder="Enter full name" />
          </label>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 sm:col-span-2">Email Address
            <input required type="email" value={form.email} onChange={e => set("email", e.target.value)} className={`${inputClass} mt-2`} placeholder="name@example.com" />
          </label>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Phone
            <input value={form.phone} onChange={e => set("phone", e.target.value)} className={`${inputClass} mt-2`} placeholder="+91 ..." />
          </label>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Role
            <select value={form.role} onChange={e => set("role", e.target.value)} className={`${inputClass} mt-2`}>
              <option>Admin</option><option>Manager</option><option>Staff</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 sm:col-span-2">Account Status
            <select value={form.status} onChange={e => set("status", e.target.value)} className={`${inputClass} mt-2`}>
              <option>Active</option><option>Inactive</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 dark:border-slate-700 dark:text-gray-200">Cancel</button>
          <button type="submit" className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25">{user ? "Save Changes" : "Create User"}</button>
        </div>
      </form>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [modalUser, setModalUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filteredUsers = useMemo(() => users.filter(user => {
    const query = search.toLowerCase();
    const matchesSearch = [user.name, user.email, user.phone].some(value => value.toLowerCase().includes(query));
    return matchesSearch && (roleFilter === "All Roles" || user.role === roleFilter) && (statusFilter === "All Status" || user.status === statusFilter);
  }), [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = users.filter(user => user.status === "Active").length;
  const adminCount = users.filter(user => user.role === "Admin").length;
  const managerCount = users.filter(user => user.role === "Manager").length;

  const saveUser = user => {
    setUsers(prev => prev.some(item => item.id === user.id)
      ? prev.map(item => item.id === user.id ? user : item)
      : [user, ...prev]);
    setModalOpen(false);
    setModalUser(null);
  };

  const deleteUser = id => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(prev => prev.filter(user => user.id !== id));
    }
  };

  const exportCsv = () => {
    const header = ["Name", "Email", "Phone", "Role", "Status", "Joined"];
    const rows = filteredUsers.map(user => [user.name, user.email, user.phone, user.role, user.status, user.joined]);
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "stockflow-users.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="text-sm text-gray-500 dark:text-gray-400">Dashboard <span className="mx-2">›</span> Users</div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 p-3 text-white shadow-lg shadow-purple-500/30"><Users size={26} /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Users & Roles</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage team members, permissions and account access.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-purple-400 dark:border-slate-700 dark:bg-[#101a3b] dark:text-gray-200"><Download size={17} /> Export</button>
          <button onClick={() => { setModalUser(null); setModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:brightness-110"><UserPlus size={18} /> Add User</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={users.length} note="Registered team members" tone="purple" />
        <StatCard icon={UserCheck} label="Active Users" value={activeCount} note="Accounts currently active" tone="green" />
        <StatCard icon={ShieldCheck} label="Managers" value={managerCount} note="Users with manager role" tone="blue" />
        <StatCard icon={UserX} label="Admins" value={adminCount} note="Users with admin access" tone="amber" />
      </div>

      <section className={panelClass}>
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Team Members</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">View and manage StockFlow user accounts.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 sm:w-72">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email or phone..." className={`${inputClass} pl-9`} />
            </div>
            <div className="relative">
              <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className={`${inputClass} min-w-36 pl-9`}>
                <option>All Roles</option><option>Admin</option><option>Manager</option><option>Staff</option>
              </select>
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={`${inputClass} sm:w-36`}>
              <option>All Status</option><option>Active</option><option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-[#111d40] dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">#</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Joined At</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {visibleUsers.map((user, index) => (
                <tr key={user.id} className="transition hover:bg-purple-50/50 dark:hover:bg-indigo-950/30">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 font-extrabold text-white">{user.name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()}</div>
                      <div className="min-w-0"><p className="font-bold text-gray-900 dark:text-white">{user.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">User ID: USR-{String(user.id).padStart(4, "0")}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><p className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><Mail size={14} className="text-purple-500" />{user.email}</p><p className="mt-1 flex items-center gap-2 text-xs text-gray-500"><Phone size={13} />{user.phone || "—"}</p></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${user.role === "Admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200" : user.role === "Manager" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200" : "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-200"}`}>{user.role}</span></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.joined}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold text-white ${user.status === "Active" ? "bg-green-700" : "bg-red-700"}`}>{user.status}</span></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1.5">
                    <button title="View user" onClick={() => setViewUser(user)} className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-purple-100 hover:text-purple-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-purple-900"><Eye size={16} /></button>
                    <button title="Edit user" onClick={() => { setModalUser(user); setModalOpen(true); }} className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"><Pencil size={16} /></button>
                    <button title="Delete user" onClick={() => deleteUser(user.id)} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300"><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
              {visibleUsers.length === 0 && <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">No users found. Try changing your search or filters.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gray-500 dark:text-gray-400">Showing {filteredUsers.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users</p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-lg border border-gray-200 p-2 text-gray-600 disabled:opacity-40 dark:border-slate-700 dark:text-gray-200"><ChevronLeft size={17} /></button>
            <span className="rounded-lg bg-purple-600 px-3 py-2 font-bold text-white">{page}</span>
            <span className="text-gray-500 dark:text-gray-400">of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="rounded-lg border border-gray-200 p-2 text-gray-600 disabled:opacity-40 dark:border-slate-700 dark:text-gray-200"><ChevronRight size={17} /></button>
          </div>
        </div>
      </section>

      {modalOpen && <UserModal user={modalUser} onClose={() => { setModalOpen(false); setModalUser(null); }} onSave={saveUser} />}

      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setViewUser(null); }}>
          <div className="w-full max-w-md rounded-2xl border border-purple-200 bg-white p-5 shadow-2xl dark:border-indigo-800 dark:bg-[#101936]">
            <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold text-gray-900 dark:text-white">User Details</h2><button onClick={() => setViewUser(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"><X size={20} /></button></div>
            <div className="my-5 flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-lg font-extrabold text-white">{viewUser.name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()}</div><div><p className="font-extrabold text-gray-900 dark:text-white">{viewUser.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{viewUser.role}</p></div></div>
            <div className="space-y-3 text-sm"><p><span className="text-gray-500">Email:</span> <span className="font-semibold text-gray-900 dark:text-white">{viewUser.email}</span></p><p><span className="text-gray-500">Phone:</span> <span className="font-semibold text-gray-900 dark:text-white">{viewUser.phone || "—"}</span></p><p><span className="text-gray-500">Joined:</span> <span className="font-semibold text-gray-900 dark:text-white">{viewUser.joined}</span></p><p><span className="text-gray-500">Status:</span> <span className="font-semibold text-gray-900 dark:text-white">{viewUser.status}</span></p></div>
          </div>
        </div>
      )}
    </div>
  );
}
