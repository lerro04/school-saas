import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState('');
    const [form, setForm]         = useState({
        first_name: '', last_name: '', date_of_birth: '',
        gender: 'male', parent_name: '', parent_phone: '',
        parent_email: '', address: '', enrollment_date: '',
    });

    const fetchStudents = (q = '') => {
        setLoading(true);
        api.get('/students', { params: { search: q } })
            .then(r => setStudents(r.data.data ?? r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        fetchStudents(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/students', form);
            setShowModal(false);
            setForm({
                first_name: '', last_name: '', date_of_birth: '',
                gender: 'male', parent_name: '', parent_phone: '',
                parent_email: '', address: '', enrollment_date: '',
            });
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to save student');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this student?')) return;
        await api.delete(`/students/${id}`);
        fetchStudents();
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Students</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{students.length} students enrolled</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    + Add Student
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by name or student number..."
                    value={search}
                    onChange={handleSearch}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {['Student No.', 'Name', 'Gender', 'Parent', 'Phone', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">No students found</td></tr>
                        ) : students.map(s => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono text-blue-600 font-medium">{s.student_number}</td>
                                <td className="px-4 py-3 font-medium text-gray-800">{s.first_name} {s.last_name}</td>
                                <td className="px-4 py-3 capitalize text-gray-600">{s.gender}</td>
                                <td className="px-4 py-3 text-gray-600">{s.parent_name}</td>
                                <td className="px-4 py-3 text-gray-600">{s.parent_phone}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                                        ${s.status === 'active' ? 'bg-green-100 text-green-700' :
                                          s.status === 'suspended' ? 'bg-red-100 text-red-700' :
                                          'bg-gray-100 text-gray-600'}`}>
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

            {/* Add Student Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-800">Add New Student</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth *</label>
                                    <input required type="date" value={form.date_of_birth}
                                        onChange={e => setForm({...form, date_of_birth: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
                                    <select required value={form.gender}
                                        onChange={e => setForm({...form, gender: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Parent Name *</label>
                                    <input required value={form.parent_name}
                                        onChange={e => setForm({...form, parent_name: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Parent Phone *</label>
                                    <input required value={form.parent_phone}
                                        onChange={e => setForm({...form, parent_phone: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Parent Email</label>
                                <input type="email" value={form.parent_email}
                                    onChange={e => setForm({...form, parent_email: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                                <input value={form.address}
                                    onChange={e => setForm({...form, address: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Enrollment Date *</label>
                                <input required type="date" value={form.enrollment_date}
                                    onChange={e => setForm({...form, enrollment_date: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}