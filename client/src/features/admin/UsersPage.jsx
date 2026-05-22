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
      <section className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
        <div className="flex min-w-0 flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="truncate text-lg font-black sm:text-2xl">Users</h1>
              {pendingUsers.length > 0 && (
                <span className="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white sm:px-2.5 sm:py-1 sm:text-sm">
                  {pendingUsers.length} new
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">Approve pending faculty and manage registered users.</p>
          </div>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 sm:px-4 sm:py-2 sm:text-sm md:w-80 md:shrink-0"
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="table-shell scrollbar-soft mt-3 sm:mt-4 -mx-3 px-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 font-semibold sm:py-3">User</th>
                <th className="py-2 font-semibold sm:py-3">Role</th>
                <th className="py-2 font-semibold sm:py-3">Status</th>
                <th className="py-2 text-right font-semibold sm:py-3">Action</th>
              </tr>
            </thead>
            <tbody>{filteredUsers.map((user) => (
              <tr key={user.id} className="border-t dark:border-slate-800">
                <td className="min-w-0 py-2 sm:py-3" data-label="User"><span className="line-clamp-1">{user.name}</span><div className="text-xs text-slate-500 line-clamp-1">{user.email}</div></td>
                <td className="py-2 sm:py-3" data-label="Role"><span className="line-clamp-1 text-xs sm:text-sm">{user.role}</span></td><td className="py-2 sm:py-3" data-label="Status"><span className="line-clamp-1 text-xs sm:text-sm">{user.status}</span></td>
                <td className="py-2 text-right sm:py-3" data-label="Action">
                  <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
                    {user.id === currentUser?.id ? (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:px-3 sm:py-1">Current</span>
                    ) : user.status === 'pending' ? (
                      <>
                        <button className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white sm:px-3 sm:py-1" onClick={() => reviewUser(user.id, 'approved')}>Approve</button>
                        <button className="rounded bg-rose-600 px-2 py-0.5 text-xs text-white sm:px-3 sm:py-1" onClick={() => reviewUser(user.id, 'rejected')}>Reject</button>
                      </>
                    ) : (
                      <button className="rounded bg-rose-700 px-2 py-0.5 text-xs text-white dark:bg-rose-600 sm:px-3 sm:py-1" onClick={() => deleteUser(user.id)}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
          {!filteredUsers.length && <p className="py-4 text-center text-xs text-slate-500 sm:py-6 sm:text-sm">No users found.</p>}
        </div>
      </section>
      <section className="min-w-0 overflow-hidden rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-base font-black sm:text-lg md:text-xl">Subject Applications</h2>
          {pendingApplications.length > 0 && (
            <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white sm:px-2.5 sm:py-1 sm:text-sm">
              {pendingApplications.length} pending
            </span>
          )}
        </div>
        {pendingApplications.map((app) => (
          <div key={app.id} className="mt-2 flex min-w-0 flex-col gap-2 border-t pt-2 dark:border-slate-800 sm:mt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-3">
            <span className="min-w-0 break-words text-xs sm:text-sm">
              <b className="line-clamp-1">{app.user_name}</b>
              <span className="text-slate-500"> ({app.email}) </span>
              <div className="line-clamp-2">applied for <b>{app.subject_name}</b> <span className="text-slate-500">{app.subject_code}</span> <b>({app.status})</b></div>
            </span>
            <div className="flex shrink-0 gap-1.5 sm:gap-2">
              <button className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white sm:px-3 sm:py-1" onClick={() => reviewApplication(app.id, 'approved')}>Approve</button>
              <button className="rounded bg-rose-600 px-2 py-0.5 text-xs text-white sm:px-3 sm:py-1" onClick={() => reviewApplication(app.id, 'rejected')}>Reject</button>
            </div>
          </div>
        ))}
        {!pendingApplications.length && (
          <p className="mt-3 rounded-lg border border-slate-200 p-2 text-xs text-slate-500 dark:border-slate-800 sm:mt-4 sm:p-3 sm:text-sm">
            No pending subject applications.
          </p>
        )}
      </section>
    </div>
  );
}
