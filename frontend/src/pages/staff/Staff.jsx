import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { X } from 'lucide-react';

export default function Staff() {
    const [staff, setStaff]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', phone: '',
        role: 'teacher', subject: '', hire_date: '', basic_salary: '',
        create_login: false, password: '',
    });

    const fetchStaff = (role = '') => {
        setLoading(true);
        api.get('/staff', { params: { role } })
            .then(r => setStaff(r.data.data ?? r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchStaff(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/staff', form);
            setShowModal(false);
            setForm({
                first_name: '', last_name: '', email: '', phone: '',
                role: 'teacher', subject: '', hire_date: '', basic_salary: '',
                create_login: false, password: '',
            });
            fetchStaff(filterRole);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to save staff member');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this staff member?')) return;
        await api.delete(`/staff/${id}`);
        fetchStaff(filterRole);
    };

    const roleColor = (role) => {
        const colors = {
            teacher:    'bg-blue-100 text-blue-700',
            bursar:     'bg-purple-100 text-purple-700',
            admin:      'bg-orange-100 text-orange-700',
            headmaster: 'bg-red-100 text-red-700',
            support:    'bg-gray-100 text-gray-600',
        };
        return colors[role] ?? 'bg-gray-100 text-gray-600';
    };

    const roles = ['', 'teacher', 'bursar', 'admin', 'headmaster', 'support'];

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{staff.length} staff members</p>
                </div>
                <button onClick={() => { setError(''); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    + Add Staff
                </button>
            </div>

            {/* Role filter */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-2">
                {roles.map(r => (
                    <button key={r}
                        onClick={() => { setFilterRole(r); fetchStaff(r); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize
                            ${filterRole === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {r === '' ? 'All' : r}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {['Staff No.', 'Name', 'Role', 'Subject', 'Email', 'Phone', 'Salary', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
                        ) : staff.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-12 text-gray-400">No staff found</td></tr>
                        ) : staff.map(s => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono text-blue-600 font-medium">{s.staff_number}</td>
                                <td className="px-4 py-3 font-medium text-gray-800">{s.first_name} {s.last_name}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColor(s.role)}`}>
                                        {s.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{s.subject ?? '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{s.email}</td>
                                <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                                <td className="px-4 py-3 font-medium">${Number(s.basic_salary).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                                        ${s.status === 'active' ? 'bg-green-100 text-green-700' :
                                          s.status === 'on_leave' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-red-100 text-red-700'}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <button onClick={() => handleDelete(s.id)}
                                        className="text-red-500 hover:text-red-700 text-xs font-medium">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-800">Add Staff Member</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                                    <input required value={form.first_name}
                                        onChange={e => setForm({...form, first_name: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                                    <input required value={form.last_name}
                                        onChange={e => setForm({...form, last_name: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                                <input required type="email" value={form.email}
                                    onChange={e => setForm({...form, email: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                                    <input required value={form.phone}
                                        onChange={e => setForm({...form, phone: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
                                    <select required value={form.role}
                                        onChange={e => setForm({...form, role: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="teacher">Teacher</option>
                                        <option value="bursar">Bursar</option>
                                        <option value="admin">Admin</option>
                                        <option value="headmaster">Headmaster</option>
                                        <option value="support">Support</option>
                                    </select>
                                </div>
                            </div>

                            {form.role === 'teacher' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                                    <input value={form.subject}
                                        onChange={e => setForm({...form, subject: e.target.value})}
                                        placeholder="e.g. Mathematics"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Hire Date *</label>
                                    <input required type="date" value={form.hire_date}
                                        onChange={e => setForm({...form, hire_date: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Basic Salary ($) *</label>
                                    <input required type="number" min="0" step="0.01" value={form.basic_salary}
                                        onChange={e => setForm({...form, basic_salary: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            {/* Create login toggle */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <input type="checkbox" id="create_login"
                                    checked={form.create_login}
                                    onChange={e => setForm({...form, create_login: e.target.checked})}
                                    className="w-4 h-4 accent-blue-600" />
                                <label htmlFor="create_login" className="text-sm text-gray-700">
                                    Create system login account for this staff member
                                </label>
                            </div>

                            {form.create_login && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                                    <input required={form.create_login} type="password" value={form.password}
                                        onChange={e => setForm({...form, password: e.target.value})}
                                        placeholder="Min 8 characters"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Add Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
