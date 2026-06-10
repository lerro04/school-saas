import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Layers, Link, Plus, X } from 'lucide-react';

export default function Fees() {
    const [invoices, setInvoices]   = useState([]);
    const [students, setStudents]   = useState([]);
    const [classes, setClasses]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [form, setForm] = useState({
        student_id: '', term: '', tuition_fee: '',
        boarding_fee: '', activity_fee: '', due_date: '',
    });

    const [bulkForm, setBulkForm] = useState({
        target: 'all', class_id: '', level: '', term: '', tuition_fee: '',
        boarding_fee: '', activity_fee: '', due_date: '',
    });

    const [payForm, setPayForm] = useState({
        amount: '', method: 'cash', transaction_reference: '', notes: '',
    });

    const fetchInvoices = (status = '') => {
        setLoading(true);
        api.get('/fee-invoices', { params: { status } })
            .then(r => setInvoices(r.data.data ?? r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchInvoices();
        api.get('/students').then(r => setStudents(r.data.data ?? r.data));
        api.get('/classes').then(r => setClasses(r.data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/fee-invoices', form);
            setShowModal(false);
            setForm({ student_id: '', term: '', tuition_fee: '', boarding_fee: '', activity_fee: '', due_date: '' });
            fetchInvoices(filterStatus);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to create invoice');
        } finally {
            setSaving(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/payments', {
                ...payForm,
                invoice_id: selectedInvoice.id,
            });
            setShowPayModal(false);
            setPayForm({ amount: '', method: 'cash', transaction_reference: '', notes: '' });
            fetchInvoices(filterStatus);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to record payment');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                term: bulkForm.term,
                tuition_fee: bulkForm.tuition_fee,
                boarding_fee: bulkForm.boarding_fee,
                activity_fee: bulkForm.activity_fee,
                due_date: bulkForm.due_date,
            };

            if (bulkForm.target === 'class') {
                payload.class_id = bulkForm.class_id;
            }
            if (bulkForm.target === 'level') {
                payload.level = bulkForm.level;
            }

            await api.post('/fee-invoices/bulk', payload);
            setShowBulkModal(false);
            setBulkForm({
                target: 'all', class_id: '', level: '', term: '', tuition_fee: '',
                boarding_fee: '', activity_fee: '', due_date: '',
            });
            fetchInvoices(filterStatus);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to create bulk invoices');
        } finally {
            setSaving(false);
        }
    };

    const openPayModal = (invoice) => {
        setSelectedInvoice(invoice);
        setPayForm({ amount: invoice.balance, method: 'cash', transaction_reference: '', notes: '' });
        setError('');
        setShowPayModal(true);
    };

    const statusColor = (status) => {
        if (status === 'paid')    return 'bg-green-100 text-green-700';
        if (status === 'partial') return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    const levels = [...new Set(classes.map(c => c.level).filter(Boolean))].sort();

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fee Invoices</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{invoices.length} invoices</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setError(''); setShowBulkModal(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                        <Layers size={16} /> Bulk Invoices
                    </button>
                    <button onClick={() => { setError(''); setShowModal(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                        <Plus size={16} /> New Invoice
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-2">
                {['', 'unpaid', 'partial', 'paid'].map(s => (
                    <button key={s}
                        onClick={() => { setFilterStatus(s); fetchInvoices(s); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition
                            ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {['Invoice No.', 'Student', 'Term', 'Total', 'Paid', 'Balance', 'Due Date', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-12 text-gray-400">No invoices found</td></tr>
                        ) : invoices.map(inv => (
                            <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono text-blue-600 font-medium">{inv.invoice_number}</td>
                                <td className="px-4 py-3 font-medium text-gray-800">
                                    {inv.student?.first_name} {inv.student?.last_name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{inv.term}</td>
                                <td className="px-4 py-3 font-semibold">${Number(inv.total_amount).toLocaleString()}</td>
                                <td className="px-4 py-3 text-green-600">${Number(inv.amount_paid).toLocaleString()}</td>
                                <td className="px-4 py-3 text-red-600 font-medium">${Number(inv.balance).toLocaleString()}</td>
                                <td className="px-4 py-3 text-gray-500">
                                    {new Date(inv.due_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {inv.status !== 'paid' && (
                                        <button onClick={() => openPayModal(inv)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                                            Record Payment
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* New Invoice Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-800">New Fee Invoice</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Student *</label>
                                <select required value={form.student_id}
                                    onChange={e => setForm({...form, student_id: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Select student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_number})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Term *</label>
                                <input required placeholder="e.g. Term 1 2026" value={form.term}
                                    onChange={e => setForm({...form, term: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tuition ($) *</label>
                                    <input required type="number" min="0" step="0.01" value={form.tuition_fee}
                                        onChange={e => setForm({...form, tuition_fee: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Boarding ($)</label>
                                    <input type="number" min="0" step="0.01" value={form.boarding_fee}
                                        onChange={e => setForm({...form, boarding_fee: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Activity ($)</label>
                                    <input type="number" min="0" step="0.01" value={form.activity_fee}
                                        onChange={e => setForm({...form, activity_fee: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
                                <input required type="date" value={form.due_date}
                                    onChange={e => setForm({...form, due_date: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                    {saving ? 'Creating...' : 'Create Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Invoice Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-800">Create Bulk Invoices</h2>
                            <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Create For *</label>
                                <select required value={bulkForm.target}
                                    onChange={e => setBulkForm({...bulkForm, target: e.target.value, class_id: '', level: ''})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="all">All active students</option>
                                    <option value="class">One class / level</option>
                                    <option value="level">All students in a level</option>
                                </select>
                            </div>

                            {bulkForm.target === 'class' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Class / Level *</label>
                                    <select required value={bulkForm.class_id}
                                        onChange={e => setBulkForm({...bulkForm, class_id: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Select class...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}{c.level ? ` - ${c.level}` : ''}{c.stream ? ` ${c.stream}` : ''} ({c.students_count ?? 0})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {bulkForm.target === 'level' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Level *</label>
                                    <select required value={bulkForm.level}
                                        onChange={e => setBulkForm({...bulkForm, level: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Select level...</option>
                                        {levels.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Term *</label>
                                <input required placeholder="e.g. Term 1 2026" value={bulkForm.term}
                                    onChange={e => setBulkForm({...bulkForm, term: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tuition ($) *</label>
                                    <input required type="number" min="0" step="0.01" value={bulkForm.tuition_fee}
                                        onChange={e => setBulkForm({...bulkForm, tuition_fee: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Boarding ($)</label>
                                    <input type="number" min="0" step="0.01" value={bulkForm.boarding_fee}
                                        onChange={e => setBulkForm({...bulkForm, boarding_fee: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Activity ($)</label>
                                    <input type="number" min="0" step="0.01" value={bulkForm.activity_fee}
                                        onChange={e => setBulkForm({...bulkForm, activity_fee: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
                                <input required type="date" value={bulkForm.due_date}
                                    onChange={e => setBulkForm({...bulkForm, due_date: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowBulkModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                    {saving ? 'Creating...' : 'Create Bulk Invoices'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showPayModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-800">Record Payment</h2>
                            <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Invoice summary */}
                        <div className="px-6 pt-4 pb-2 bg-blue-50 mx-6 mt-4 rounded-lg text-sm">
                            <p className="font-medium text-blue-800">{selectedInvoice.invoice_number}</p>
                            <p className="text-blue-600 text-xs mt-0.5">
                                {selectedInvoice.student?.first_name} {selectedInvoice.student?.last_name} — {selectedInvoice.term}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-blue-700">
                                <span>Total: <strong>${Number(selectedInvoice.total_amount).toLocaleString()}</strong></span>
                                <span>Paid: <strong>${Number(selectedInvoice.amount_paid).toLocaleString()}</strong></span>
                                <span>Balance: <strong>${Number(selectedInvoice.balance).toLocaleString()}</strong></span>
                            </div>
                        </div>

                        <form onSubmit={handlePayment} className="p-6 space-y-4">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($) *</label>
                                <input required type="number" min="0.01" step="0.01" value={payForm.amount}
                                    onChange={e => setPayForm({...payForm, amount: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
    <select required value={payForm.method}
        onChange={e => setPayForm({...payForm, method: e.target.value})}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="cash">Cash</option>
        <option value="ecocash">EcoCash (via Paynow)</option>
        <option value="onemoney">OneMoney (via Paynow)</option>
        <option value="zipit">ZIPIT</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="webpayment">Web Payment (via Paynow)</option>
    </select>
</div>

{['ecocash', 'onemoney', 'webpayment'].includes(payForm.method) && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="text-blue-700 font-medium mb-2 flex items-center gap-2">
            <Link size={14} /> Paynow Online Payment
        </p>
        <p className="text-blue-600 text-xs">
            {payForm.method === 'webpayment'
                ? 'Customer will be redirected to Paynow to complete payment.'
                : 'Customer will receive a Paynow prompt on their phone.'}
        </p>
    </div>
)}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Reference</label>
                                <input value={payForm.transaction_reference}
                                    onChange={e => setPayForm({...payForm, transaction_reference: e.target.value})}
                                    placeholder="e.g. EcoCash transaction ID"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                                <textarea value={payForm.notes} rows={2}
                                    onChange={e => setPayForm({...payForm, notes: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowPayModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                    {saving ? 'Processing...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
