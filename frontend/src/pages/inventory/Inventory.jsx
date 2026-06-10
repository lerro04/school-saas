import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Plus, Trash2, Edit2, Package, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    const [form, setForm] = useState({
        name: '',
        category: 'stationery',
        unit: 'pieces',
        quantity_in_stock: '',
        reorder_level: '10',
        unit_cost: '',
        supplier_name: '',
        location: '',
        description: '',
    });

    const [restockForm, setRestockForm] = useState({
        quantity: '',
        reference: '',
        notes: '',
    });

    const [usageForm, setUsageForm] = useState({
        quantity: '',
        reference: '',
        notes: '',
    });

    const categoryOptions = ['stationery', 'cleaning', 'laboratory', 'maintenance', 'food', 'technology', 'other'];

    const fetchItems = async () => {
        setLoading(true);
        const params = {};
        if (filterCategory) params.category = filterCategory;
        if (showLowStockOnly) params.low_stock = true;

        try {
            const [itemsRes, summaryRes] = await Promise.all([
                api.get('/inventory', { params }),
                api.get('/inventory-summary'),
            ]);
            setItems(itemsRes.data.data ?? itemsRes.data);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [filterCategory, showLowStockOnly]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/inventory/${editingId}`, form);
            } else {
                await api.post('/inventory', form);
            }
            setShowModal(false);
            setEditingId(null);
            setForm({
                name: '',
                category: 'stationery',
                unit: 'pieces',
                quantity_in_stock: '',
                reorder_level: '10',
                unit_cost: '',
                supplier_name: '',
                location: '',
                description: '',
            });
            fetchItems();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to save item');
        } finally {
            setSaving(false);
        }
    };

    const handleRestock = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/inventory/restock', {
                item_id: selectedItem.id,
                ...restockForm,
            });
            setShowRestockModal(false);
            setSelectedItem(null);
            setRestockForm({ quantity: '', reference: '', notes: '' });
            fetchItems();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to restock item');
        } finally {
            setSaving(false);
        }
    };

    const handleUsageOut = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/inventory/usage-out', {
                item_id: selectedItem.id,
                ...usageForm,
            });
            setShowUsageModal(false);
            setSelectedItem(null);
            setUsageForm({ quantity: '', reference: '', notes: '' });
            fetchItems();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to record usage');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setForm({
            name: item.name,
            category: item.category,
            unit: item.unit,
            quantity_in_stock: item.quantity_in_stock,
            reorder_level: item.reorder_level,
            unit_cost: item.unit_cost,
            supplier_name: item.supplier_name,
            location: item.location,
            description: item.description,
        });
        setEditingId(item.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this inventory item?')) {
            try {
                await api.delete(`/inventory/${id}`);
                fetchItems();
            } catch (err) {
                alert('Failed to delete item');
            }
        }
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Package className="w-6 h-6 text-indigo-600" />
                        <h1 className="text-3xl font-bold">Inventory Management</h1>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({
                                name: '',
                                category: 'stationery',
                                unit: 'pieces',
                                quantity_in_stock: '',
                                reorder_level: '10',
                                unit_cost: '',
                                supplier_name: '',
                                location: '',
                                description: '',
                            });
                            setShowModal(true);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Total Items</p>
                            <p className="text-2xl font-bold text-blue-600">{summary.total_items}</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Low Stock Alert</p>
                            <p className="text-2xl font-bold text-red-600">{summary.low_stock_count}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Inventory Value</p>
                            <p className="text-2xl font-bold text-green-600">${parseFloat(summary.total_inventory_value).toFixed(0)}</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">Categories</p>
                            <p className="text-2xl font-bold text-purple-600">{Object.keys(summary.by_category).length}</p>
                        </div>
                    </div>
                )}

                {/* Low Stock Warning */}
                {summary && summary.low_stock_items.length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                                <p className="font-semibold text-yellow-800">Low Stock Items</p>
                                <p className="text-sm text-yellow-700">{summary.low_stock_items.length} items need restocking</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-4 flex gap-2 flex-wrap items-end">
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
                    <label className="flex items-center gap-2 border rounded px-3 py-2 bg-white cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showLowStockOnly}
                            onChange={(e) => setShowLowStockOnly(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="text-sm">Low Stock Only</span>
                    </label>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No inventory items</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Code</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Item Name</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Category</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Stock</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Unit Cost</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Total Value</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Status</th>
                                    <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const lowStock = item.quantity_in_stock <= item.reorder_level;
                                    return (
                                        <tr key={item.id} className={`border-t hover:bg-gray-50 ${lowStock ? 'bg-red-50' : ''}`}>
                                            <td className="px-4 py-2 text-sm font-semibold">{item.item_code}</td>
                                            <td className="px-4 py-2 text-sm">{item.name}</td>
                                            <td className="px-4 py-2 text-sm">{item.category}</td>
                                            <td className="px-4 py-2 text-sm">
                                                <span className={lowStock ? 'font-bold text-red-600' : ''}>
                                                    {item.quantity_in_stock} {item.unit}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm">${parseFloat(item.unit_cost).toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm font-semibold">
                                                ${(item.quantity_in_stock * item.unit_cost).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-sm">
                                                {lowStock ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                                        OK
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-sm flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowRestockModal(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Restock"
                                                >
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowUsageModal(true);
                                                    }}
                                                    className="text-orange-600 hover:text-orange-800 p-1"
                                                    title="Record Usage"
                                                >
                                                    <ArrowDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-600 hover:text-red-800 p-1"
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

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Item</h2>
                            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Item Name *</label>
                                        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Category *</label>
                                        <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded px-3 py-2">
                                            {categoryOptions.map(c => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Unit *</label>
                                        <input type="text" required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="e.g., pieces, reams, boxes" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Unit Cost *</label>
                                        <input type="number" required step="0.01" min="0" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} className="w-full border rounded px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Reorder Level *</label>
                                        <input type="number" required min="0" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} className="w-full border rounded px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Quantity in Stock</label>
                                        <input type="number" min="0" value={form.quantity_in_stock} onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })} className="w-full border rounded px-3 py-2" />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Restock Modal */}
                {showRestockModal && selectedItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h2 className="text-xl font-bold mb-4">Restock: {selectedItem.name}</h2>
                            <form onSubmit={handleRestock}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Quantity to Add *</label>
                                        <input type="number" required min="1" value={restockForm.quantity} onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })} className="w-full border rounded px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Reference (PO #, etc)</label>
                                        <input type="text" value={restockForm.reference} onChange={(e) => setRestockForm({ ...restockForm, reference: e.target.value })} className="w-full border rounded px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Notes</label>
                                        <textarea value={restockForm.notes} onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })} className="w-full border rounded px-3 py-2" rows="2" />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button type="button" onClick={() => { setShowRestockModal(false); setSelectedItem(null); }} className="flex-1 px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{saving ? 'Processing...' : 'Restock'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Usage Modal */}
                {showUsageModal && selectedItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h2 className="text-xl font-bold mb-4">Record Usage: {selectedItem.name}</h2>
                            <form onSubmit={handleUsageOut}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Quantity to Remove *</label>
                                        <input type="number" required min="1" max={selectedItem.quantity_in_stock} value={usageForm.quantity} onChange={(e) => setUsageForm({ ...usageForm, quantity: e.target.value })} className="w-full border rounded px-3 py-2" />
                                        <p className="text-xs text-gray-500 mt-1">Available: {selectedItem.quantity_in_stock}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Reference (Dept, Person, etc)</label>
                                        <input type="text" value={usageForm.reference} onChange={(e) => setUsageForm({ ...usageForm, reference: e.target.value })} className="w-full border rounded px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Notes</label>
                                        <textarea value={usageForm.notes} onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })} className="w-full border rounded px-3 py-2" rows="2" />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button type="button" onClick={() => { setShowUsageModal(false); setSelectedItem(null); }} className="flex-1 px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50">{saving ? 'Processing...' : 'Record Usage'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
