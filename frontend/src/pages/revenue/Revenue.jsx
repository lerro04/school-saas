import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Plus, Trash2, Edit2, DollarSign } from 'lucide-react';

export default function Revenue() {
    const [revenues, setRevenues] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [filterSource, setFilterSource] = useState('');

    const [form, setForm] = useState({
        source: 'tuition',
        amount: '',
        student_id: '',
        description: '',
        payment_method: 'cash',
        transaction_reference: '',
        revenue_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const revenueSourceOptions = [
        'tuition', 'activity', 'exam', 'transport', 'uniform', 'lunch', 'donation', 'other'
    ];

    const paymentMethods = ['cash', 'ecocash', 'zikit', 'bank_transfer', 'paynow'];

    const fetchRevenues = () => {
        setLoading(true);
        api.get('/revenues', { params: { source: filterSource } })
            .then(r => setRevenues(r.data.data ?? r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRevenues();
        api.get('/students').then(r => setStudents(r.data.data ?? r.data));
    }, [filterSource]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/revenues/${editingId}`, form);
            } else {
                await api.post('/revenues', form);
            }
            setShowModal(false);
            setEditingId(null);
            setForm({
                source: 'tuition',
                amount: '',
                student_id: '',
                description: '',
                payment_method: 'cash',
                transaction_reference: '',
                revenue_date: new Date().toISOString().split('T')[0],
                notes: '',
            });
            fetchRevenues();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to save revenue');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (revenue) => {
        setForm({
            source: revenue.source,
            amount: revenue.amount,
            student_id: revenue.student_id || '',
            description: revenue.description,
            payment_method: revenue.payment_method,
            transaction_reference: revenue.transaction_reference,
            revenue_date: revenue.revenue_date,
            notes: revenue.notes,
        });
        setEditingId(revenue.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this revenue entry?')) {
            try {
                await api.delete(`/revenues/${id}`);
                fetchRevenues();
            } catch (err) {
                alert('Failed to delete revenue');
            }
        }
    };

    const totalRevenue = revenues.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    return (
        <Layout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-green-600" />
                        <h1 className="text-3xl font-bold">Revenue Management</h1>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({
                                source: 'tuition',
                                amount: '',
                                student_id: '',
                                description: '',
                                payment_method: 'cash',
                                transaction_reference: '',
                                revenue_date: new Date().toISOString().split('T')[0],
                                notes: '',
                            });
                            setShowModal(true);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4" /> Add Revenue
                    </button>
                </div>

                {/* Summary Card */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-gray-600 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                </div>

                {/* Filters */}
                <div className="mb-4 flex gap-2">
                    <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="">All Sources</option>
                        {revenueSourceOptions.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* Revenue Table */}
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : revenues.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No revenue records yet</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Reference</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Source</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Student</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Amount</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Method</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Date</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Status</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenues.map(r => (
                                    <tr key={r.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm">{r.reference_number}</td>
                                        <td className="px-4 py-2 text-sm">{r.source}</td>
                                        <td className="px-4 py-2 text-sm">
                                            {r.student ? `${r.student.first_name} ${r.student.last_name}` : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-semibold">${parseFloat(r.amount).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm">{r.payment_method || '-'}</td>
                                        <td className="px-4 py-2 text-sm">{new Date(r.revenue_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                r.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <button
                                                onClick={() => handleEdit(r)}
                                                className="text-blue-600 hover:text-blue-800 mr-2"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Revenue</h2>
                            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Source *</label>
                                        <select
                                            required
                                            value={form.source}
                                            onChange={(e) => setForm({ ...form, source: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            {revenueSourceOptions.map(s => (
                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Amount *</label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            min="0.01"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Student</label>
                                        <select
                                            value={form.student_id}
                                            onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            <option value="">Select student (optional)</option>
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Description</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                            rows="2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Payment Method</label>
                                        <select
                                            value={form.payment_method}
                                            onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            {paymentMethods.map(m => (
                                                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={form.revenue_date}
                                            onChange={(e) => setForm({ ...form, revenue_date: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
