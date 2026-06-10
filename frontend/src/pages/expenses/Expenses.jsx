import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Plus, Trash2, Edit2, TrendingDown, Check } from 'lucide-react';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [form, setForm] = useState({
        category: 'other',
        amount: '',
        vendor_name: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        receipt_number: '',
        status: 'pending',
        notes: '',
    });

    const expenseCategoryOptions = [
        'salaries', 'utilities', 'maintenance', 'supplies', 'transport', 'food', 'equipment', 'rent', 'software', 'other'
    ];

    const paymentMethods = ['cash', 'cheque', 'bank_transfer', 'ecocash', 'paynow'];
    const statusOptions = ['pending', 'approved', 'paid', 'rejected'];

    const fetchExpenses = () => {
        setLoading(true);
        const params = {};
        if (filterCategory) params.category = filterCategory;
        if (filterStatus) params.status = filterStatus;

        api.get('/expenses', { params })
            .then(r => setExpenses(r.data.data ?? r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchExpenses();
    }, [filterCategory, filterStatus]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/expenses/${editingId}`, form);
            } else {
                await api.post('/expenses', form);
            }
            setShowModal(false);
            setEditingId(null);
            setForm({
                category: 'other',
                amount: '',
                vendor_name: '',
                description: '',
                expense_date: new Date().toISOString().split('T')[0],
                payment_method: 'bank_transfer',
                receipt_number: '',
                status: 'pending',
                notes: '',
            });
            fetchExpenses();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to save expense');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (expense) => {
        setForm({
            category: expense.category,
            amount: expense.amount,
            vendor_name: expense.vendor_name,
            description: expense.description,
            expense_date: expense.expense_date,
            payment_method: expense.payment_method,
            receipt_number: expense.receipt_number,
            status: expense.status,
            notes: expense.notes,
        });
        setEditingId(expense.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this expense?')) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchExpenses();
            } catch (err) {
                alert('Failed to delete expense');
            }
        }
    };

    const handleBulkApprove = async () => {
        const selectedExpenses = expenses.filter(e => e.status === 'pending');
        if (selectedExpenses.length === 0) {
            alert('No pending expenses to approve');
            return;
        }
        try {
            await api.post('/expenses/approve-bulk', {
                expense_ids: selectedExpenses.map(e => e.id)
            });
            fetchExpenses();
        } catch (err) {
            alert('Failed to approve expenses');
        }
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const pendingExpenses = expenses.filter(e => e.status === 'pending').length;

    return (
        <Layout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="w-6 h-6 text-red-600" />
                        <h1 className="text-3xl font-bold">Expense Management</h1>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({
                                category: 'other',
                                amount: '',
                                vendor_name: '',
                                description: '',
                                expense_date: new Date().toISOString().split('T')[0],
                                payment_method: 'bank_transfer',
                                receipt_number: '',
                                status: 'pending',
                                notes: '',
                            });
                            setShowModal(true);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700"
                    >
                        <Plus className="w-4 h-4" /> Add Expense
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-gray-600 text-sm">Total Expenses</p>
                        <p className="text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-gray-600 text-sm">Pending Approval</p>
                        <p className="text-3xl font-bold text-yellow-600">{pendingExpenses}</p>
                        {pendingExpenses > 0 && (
                            <button
                                onClick={handleBulkApprove}
                                className="mt-2 text-sm bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" /> Approve All
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-4 flex gap-2 flex-wrap">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="">All Categories</option>
                        {expenseCategoryOptions.map(c => (
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

                {/* Expenses Table */}
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No expenses recorded yet</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Reference</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Category</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Vendor</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Amount</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Date</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Status</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(e => (
                                    <tr key={e.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm">{e.reference_number}</td>
                                        <td className="px-4 py-2 text-sm">{e.category}</td>
                                        <td className="px-4 py-2 text-sm">{e.vendor_name || '-'}</td>
                                        <td className="px-4 py-2 text-sm font-semibold">${parseFloat(e.amount).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm">{new Date(e.expense_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                e.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                e.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                e.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {e.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <button
                                                onClick={() => handleEdit(e)}
                                                className="text-blue-600 hover:text-blue-800 mr-2"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(e.id)}
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
                            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Expense</h2>
                            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Category *</label>
                                        <select
                                            required
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            {expenseCategoryOptions.map(c => (
                                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
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
                                        <label className="block text-sm font-semibold mb-1">Vendor Name</label>
                                        <input
                                            type="text"
                                            value={form.vendor_name}
                                            onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Description *</label>
                                        <textarea
                                            required
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                            rows="2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={form.expense_date}
                                            onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
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
