import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Plus, Trash2, Edit2, Package, Zap } from 'lucide-react';

export default function Assets() {
    const [assets, setAssets] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('active');
    const [filterCondition, setFilterCondition] = useState('');

    const [form, setForm] = useState({
        name: '',
        category: 'equipment',
        description: '',
        purchase_price: '',
        current_value: '',
        purchase_date: new Date().toISOString().split('T')[0],
        location: '',
        condition: 'good',
        status: 'active',
        supplier_name: '',
        warranty_info: '',
        warranty_expiry: '',
        notes: '',
    });

    const categoryOptions = ['furniture', 'equipment', 'electronics', 'vehicles', 'tools', 'sports', 'laboratory', 'library', 'other'];
    const conditionOptions = ['excellent', 'good', 'fair', 'poor'];
    const statusOptions = ['active', 'inactive', 'disposed', 'lost'];

    const fetchAssets = async () => {
        setLoading(true);
        const params = {};
        if (filterCategory) params.category = filterCategory;
        if (filterStatus) params.status = filterStatus;
        if (filterCondition) params.condition = filterCondition;

        try {
            const [assetsRes, summaryRes] = await Promise.all([
                api.get('/assets', { params }),
                api.get('/assets-summary', { params }),
            ]);
            setAssets(assetsRes.data.data ?? assetsRes.data);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [filterCategory, filterStatus, filterCondition]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/assets/${editingId}`, form);
            } else {
                await api.post('/assets', form);
            }
            setShowModal(false);
            setEditingId(null);
            setForm({
                name: '',
                category: 'equipment',
                description: '',
                purchase_price: '',
                current_value: '',
                purchase_date: new Date().toISOString().split('T')[0],
                location: '',
                condition: 'good',
                status: 'active',
                supplier_name: '',
                warranty_info: '',
                warranty_expiry: '',
                notes: '',
            });
            fetchAssets();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to save asset');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (asset) => {
        setForm({
            name: asset.name,
            category: asset.category,
            description: asset.description,
            purchase_price: asset.purchase_price,
            current_value: asset.current_value,
            purchase_date: asset.purchase_date,
            location: asset.location,
            condition: asset.condition,
            status: asset.status,
            supplier_name: asset.supplier_name,
            warranty_info: asset.warranty_info,
            warranty_expiry: asset.warranty_expiry,
            notes: asset.notes,
        });
        setEditingId(asset.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this asset?')) {
            try {
                await api.delete(`/assets/${id}`);
                fetchAssets();
            } catch (err) {
                alert('Failed to delete asset');
            }
        }
    };

    const getConditionColor = (condition) => {
        switch (condition) {
            case 'excellent': return 'bg-green-100 text-green-700';
            case 'good': return 'bg-blue-100 text-blue-700';
            case 'fair': return 'bg-yellow-100 text-yellow-700';
            case 'poor': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Package className="w-6 h-6 text-purple-600" />
                        <h1 className="text-3xl font-bold">Assets Management</h1>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({
                                name: '',
                                category: 'equipment',
                                description: '',
                                purchase_price: '',
                                current_value: '',
                                purchase_date: new Date().toISOString().split('T')[0],
                                location: '',
                                condition: 'good',
                                status: 'active',
                                supplier_name: '',
                                warranty_info: '',
                                warranty_expiry: '',
                                notes: '',
                            });
                            setShowModal(true);
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-purple-700"
                    >
                        <Plus className="w-4 h-4" /> Add Asset
                    </button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Total Assets</p>
                            <p className="text-2xl font-bold text-blue-600">{summary.total_assets}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Purchase Value</p>
                            <p className="text-2xl font-bold text-green-600">${parseFloat(summary.total_purchase_value).toFixed(0)}</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Current Value</p>
                            <p className="text-2xl font-bold text-purple-600">${parseFloat(summary.total_current_value).toFixed(0)}</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Depreciation</p>
                            <p className="text-2xl font-bold text-orange-600">{summary.depreciation_percentage}%</p>
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
                        {statusOptions.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                    <select
                        value={filterCondition}
                        onChange={(e) => setFilterCondition(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="">All Conditions</option>
                        {conditionOptions.map(c => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* Assets Table */}
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : assets.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No assets recorded yet</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Code</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Name</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Category</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Purchase Value</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Current Value</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Location</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Condition</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map(a => (
                                    <tr key={a.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm font-semibold">{a.asset_code}</td>
                                        <td className="px-4 py-2 text-sm">{a.name}</td>
                                        <td className="px-4 py-2 text-sm">{a.category}</td>
                                        <td className="px-4 py-2 text-sm">${parseFloat(a.purchase_price).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm">${parseFloat(a.current_value).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm">{a.location || '-'}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getConditionColor(a.condition)}`}>
                                                {a.condition}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <button
                                                onClick={() => handleEdit(a)}
                                                className="text-blue-600 hover:text-blue-800 mr-2"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(a.id)}
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
                            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Asset</h2>
                            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Asset Name *</label>
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
                                        <label className="block text-sm font-semibold mb-1">Purchase Price *</label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            value={form.purchase_price}
                                            onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Current Value *</label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            value={form.current_value}
                                            onChange={(e) => setForm({ ...form, current_value: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Purchase Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={form.purchase_date}
                                            onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Location</label>
                                        <input
                                            type="text"
                                            value={form.location}
                                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Condition</label>
                                        <select
                                            value={form.condition}
                                            onChange={(e) => setForm({ ...form, condition: e.target.value })}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            {conditionOptions.map(c => (
                                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
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
