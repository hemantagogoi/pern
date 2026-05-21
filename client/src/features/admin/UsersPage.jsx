import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { api } from '../../lib/api.js';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const currentUser = useSelector((state) => state.auth.user);
  const refresh = () => {
    api.get('/admin/users').then(({ data }) => setUsers(data));
    api.get('/admin/subject-applications').then(({ data }) => setApplications(data));
  };
  useEffect(refresh, []);

  const filteredUsers = users.filter((user) => {
    const value = search.toLowerCase();
    return [user.name, user.email, user.role, user.status]
      .join(' ')
      .toLowerCase()
      .includes(value);
  });
  const pendingUsers = users.filter((user) => user.status === 'pending');
  const pendingApplications = applications.filter((app) => app.status === 'pending');

  async function reviewUser(id, status) {
    await api.patch(`/admin/users/${id}/status`, { status });
    toast.success(`User ${status}`);
    refresh();
  }

  async function deleteUser(id) {
    if (id === currentUser?.id) {
      toast.error('You cannot delete your own admin account');
      return;
    }
    if (!confirm('Delete this user permanently?')) return;
    await api.delete(`/admin/users/${id}`);
    toast.success('User deleted');
    refresh();
  }

  async function reviewApplication(id, status) {
    await api.patch(`/admin/subject-applications/${id}`, { status });
    toast.success(`Application ${status}`);
    refresh();
  }

  return (
    <div className="space-y-6">
      <section className="min-w-0 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black">Users</h1>
              {pendingUsers.length > 0 && (
                <span className="rounded-full bg-rose-600 px-2.5 py-1 text-sm font-bold text-white">
                  {pendingUsers.length} new registration
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">Approve pending faculty and manage registered users.</p>
          </div>
          <input
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 md:w-80"
            placeholder="Search users by name, email, role, status"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="table-shell scrollbar-soft mt-4">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 font-semibold">User</th>
                <th className="py-3 font-semibold">Role</th>
                <th className="py-3 font-semibold">Status</th>
                <th className="py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>{filteredUsers.map((user) => (
              <tr key={user.id} className="border-t dark:border-slate-800">
                <td className="py-3">{user.name}<div className="text-slate-500">{user.email}</div></td>
                <td>{user.role}</td><td>{user.status}</td>
                <td className="space-x-2 text-right">
                  {user.id === currentUser?.id ? (
                    <span className="rounded bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Current admin</span>
                  ) : user.status === 'pending' ? (
                    <>
                      <button className="rounded bg-emerald-600 px-3 py-1 text-white" onClick={() => reviewUser(user.id, 'approved')}>Approve</button>
                      <button className="rounded bg-rose-600 px-3 py-1 text-white" onClick={() => reviewUser(user.id, 'rejected')}>Reject</button>
                    </>
                  ) : (
                    <button className="rounded bg-rose-700 px-3 py-1 text-white dark:bg-rose-600" onClick={() => deleteUser(user.id)}>Delete User</button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
          {!filteredUsers.length && <p className="py-6 text-center text-sm text-slate-500">No users found.</p>}
        </div>
      </section>
      <section className="min-w-0 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-black">Subject Applications</h2>
          {pendingApplications.length > 0 && (
            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-sm font-bold text-white">
              {pendingApplications.length} pending
            </span>
          )}
        </div>
        {pendingApplications.map((app) => (
          <div key={app.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3 dark:border-slate-800">
            <span className="min-w-0 break-words">
              <b>{app.user_name}</b>
              <span className="text-slate-500"> ({app.email}) </span>
              applied for <b>{app.subject_name}</b>
              <span className="text-slate-500"> {app.subject_code}</span>
              <b> ({app.status})</b>
            </span>
            <div className="flex shrink-0 gap-2">
              <button className="rounded bg-emerald-600 px-3 py-1 text-white" onClick={() => reviewApplication(app.id, 'approved')}>Approve</button>
              <button className="rounded bg-rose-600 px-3 py-1 text-white" onClick={() => reviewApplication(app.id, 'rejected')}>Reject</button>
            </div>
          </div>
        ))}
        {!pendingApplications.length && (
          <p className="mt-4 rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
            No pending subject applications.
          </p>
        )}
      </section>
    </div>
  );
}
