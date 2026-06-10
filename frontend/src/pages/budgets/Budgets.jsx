import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Plus, Trash2, Edit2, DollarSign, TrendingUp } from 'lucide-react';

export default function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [form, setForm] = useState({
        name: '',
        category: 'operational',
        allocated_amount: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        description: '',
        status: 'draft',
        notes: '',
    });

    const categoryOptions = ['operational', 'payroll', 'maintenance', 'supplies', 'utilities', 'transport', 'other'];
    const statusOptions = ['draft', 'approved', 'active', 'completed', 'suspended'];

    const fetchBudgets = async () => {
        setLoading(true);
        const params = {};
        if (filterCategory) params.category = filterCategory;
        if (filterStatus) params.status = filterStatus;

        try {
            const [budgetsRes, summaryRes] = await Promise.all([
                api.get('/budgets', { params }),
                api.get('/budgets-summary', { params }),
            ]);
            setBudgets(budgetsRes.data.data ?? budgetsRes.data);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, [filterCategory, filterStatus]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/budgets/${editingId}`, form);
            } else {
                await api.post('/budgets', form);
            }
            setShowModal(false);
            setEditingId(null);
            setForm({
                name: '',
                category: 'operational',
                allocated_amount: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                description: '',
                status: 'draft',
                notes: '',
            });
            fetchBudgets();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to save budget');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (budget) => {
        setForm({
            name: budget.name,
            category: budget.category,
            allocated_amount: budget.allocated_amount,
            start_date: budget.start_date,
            end_date: budget.end_date,
            description: budget.description,
            status: budget.status,
            notes: budget.notes,
        });
        setEditingId(budget.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this budget?')) {
            try {
                await api.delete(`/budgets/${id}`);
                fetchBudgets();
            } catch (err) {
                alert('Failed to delete budget');
            }
        }
    };

    const getUtilizationColor = (percent) => {
        if (percent >= 90) return 'text-red-600';
        if (percent >= 75) return 'text-yellow-600';
        return 'text-green-600';
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                        <h1 className="text-3xl font-bold">Budget Management</h1>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({
                                name: '',
                                category: 'operational',
                                allocated_amount: '',
                                start_date: new Date().toISOString().split('T')[0],
                                end_date: '',
                                description: '',
                                status: 'draft',
                                notes: '',
                            });
                            setShowModal(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" /> Add Budget
                    </button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Total Allocated</p>
                            <p className="text-2xl font-bold text-blue-600">${parseFloat(summary.total_allocated).toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Total Spent</p>
                            <p className="text-2xl font-bold text-orange-600">${parseFloat(summary.total_spent).toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Remaining</p>
                            <p className="text-2xl font-bold text-green-600">${parseFloat(summary.total_remaining).toFixed(2)}</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Utilization</p>
                            <p className={`text-2xl font-bold ${getUtilizationColor(summary.utilization)}`}>
                                {summary.utilization}%
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-4 flex gap-2 flex-wrap">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="">All Categories</option>
                        {categoryOptions.map(c => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="">All Statuses</option>
                        {statusOptions.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* Budgets Table */}
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : budgets.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No budgets created yet</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Name</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Category</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Allocated</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Spent</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Remaining</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Utilization</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Status</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgets.map(b => {
                                    const utilization = b.allocated_amount > 0
                                        ? ((b.spent_amount / b.allocated_amount) * 100).toFixed(1)
                                        : 0;
                                    return (
                                        <tr key={b.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm font-semibold">{b.name}</td>
                                            <td className="px-4 py-2 text-sm">{b.category}</td>
                                            <td className="px-4 py-2 text-sm">${parseFloat(b.allocated_amount).toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm">${parseFloat(b.spent_amount).toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm">${(b.allocated_amount - b.spent_amount).toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                utilization >= 90 ? 'bg-red-600' :
                                                                utilization >= 75 ? 'bg-yellow-600' :
                                                                'bg-green-600'
                                                            }`}
                                                            style={{ width: `${Math.min(utilization, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-semibold ${getUtilizationColor(utilization)}`}>
                                                        {utilization}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                    b.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    b.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                    b.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                                    b.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm">
                                                <button
                                                    onClick={() => handleEdit(b)}
                                                    className="text-blue-600 hover:text-blue-800 mr-2"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(b.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Budget</h2>
                            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Budget Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Category *</label>
                                        <select
                                            required
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            {categoryOptions.map(c => (
                                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Allocated Amount *</label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            min="0.01"
                                            value={form.allocated_amount}
                                            onChange={(e) => setForm({ ...form, allocated_amount: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={form.start_date}
                                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">End Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={form.end_date}
                                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Status</label>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            {statusOptions.map(s => (
                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
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
