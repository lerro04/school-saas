import { useState, useEffect } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';
import { X } from 'lucide-react';

export default function ParentDashboard() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying]   = useState(false);
    const [selected, setSelected] = useState(null);
    const [payForm, setPayForm] = useState({ phone: '', method: 'ecocash' });
    const [pollUrl, setPollUrl] = useState(null);
    const [message, setMessage] = useState('');
    const [polling, setPolling] = useState(false);

    useEffect(() => {
        portalApi.get('/parent/dashboard')
            .then(r => setData(r.data))
            .finally(() => setLoading(false));
    }, []);

    const handlePay = async (e) => {
        e.preventDefault();
        setPaying(true);
        try {
            const r = await portalApi.post('/parent/pay-fees', {
                invoice_id: selected.id,
                phone: payForm.phone,
                method: payForm.method,
            });
            setPollUrl(r.data.poll_url);
            setMessage(r.data.instructions ?? 'Check your phone for the payment prompt.');
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Payment failed');
        } finally {
            setPaying(false);
        }
    };

    const handlePoll = async () => {
        setPolling(true);
        try {
            const r = await portalApi.post('/paynow/poll', {
                poll_url: pollUrl,
                invoice_id: selected.id,
            });
            if (r.data.paid) {
                setMessage('Payment confirmed!');
                setSelected(null);
                setPollUrl(null);
                portalApi.get('/parent/dashboard').then(r => setData(r.data));
            } else {
                setMessage(`Status: ${r.data.status}. Complete payment then check again.`);
            }
        } finally {
            setPolling(false);
        }
    };

    if (loading) return <PortalLayout><div className="text-center py-20 text-gray-400">Loading...</div></PortalLayout>;

    const statusColor = (s) => s === 'paid' ? 'bg-green-100 text-green-700' :
        s === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

    return (
        <PortalLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                    Viewing: {data?.child?.first_name} {data?.child?.last_name} — {data?.child?.student_number}
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-red-600">${Number(data?.total_balance ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">Results Available</p>
                    <p className="text-2xl font-bold text-blue-600">{data?.results?.length ?? 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">Announcements</p>
                    <p className="text-2xl font-bold text-emerald-600">{data?.announcements?.length ?? 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Fee invoices */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <h3 className="font-semibold text-gray-700 mb-4">Fee Statements</h3>
                    {data?.fees?.length === 0 ? (
                        <p className="text-gray-400 text-sm">No invoices found</p>
                    ) : data?.fees?.map(fee => (
                        <div key={fee.id} className="flex items-center justify-between py-3 border-b last:border-0">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{fee.term}</p>
                                <p className="text-xs text-gray-500">Balance: ${Number(fee.balance).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(fee.status)}`}>{fee.status}</span>
                                {fee.status !== 'paid' && (
                                    <button onClick={() => { setSelected(fee); setMessage(''); setPollUrl(null); }}
                                        className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-lg">
                                        Pay
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent results */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <h3 className="font-semibold text-gray-700 mb-4">Recent Results</h3>
                    {data?.results?.length === 0 ? (
                        <p className="text-gray-400 text-sm">No results published yet</p>
                    ) : data?.results?.map(r => (
                        <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{r.subject}</p>
                                <p className="text-xs text-gray-500">{r.term}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold">{r.score ?? '—'}</p>
                                {r.grade && <span className="text-xs text-blue-600 font-bold">{r.grade}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Announcements */}
            {data?.announcements?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-5 mt-4">
                    <h3 className="font-semibold text-gray-700 mb-4">School Announcements</h3>
                    {data.announcements.map(a => (
                        <div key={a.id} className="py-3 border-b last:border-0">
                            <p className="text-sm font-medium text-gray-800">{a.title}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{a.body}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Payment Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Pay Fees</h2>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
                            <p className="font-medium text-blue-800">{selected.term}</p>
                            <p className="text-blue-600">Balance: <strong>${Number(selected.balance).toLocaleString()}</strong></p>
                        </div>
                        {message && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">{message}</div>
                        )}
                        {!pollUrl ? (
                            <form onSubmit={handlePay} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                                    <select value={payForm.method}
                                        onChange={e => setPayForm({...payForm, method: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="ecocash">EcoCash</option>
                                        <option value="onemoney">OneMoney</option>
                                        <option value="webpayment">Web Payment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                                    <input required value={payForm.phone}
                                        onChange={e => setPayForm({...payForm, phone: e.target.value})}
                                        placeholder="e.g. 0771234567"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <button type="submit" disabled={paying}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                                    {paying ? 'Initiating...' : 'Pay Now'}
                                </button>
                            </form>
                        ) : (
                            <button onClick={handlePoll} disabled={polling}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                                {polling ? 'Checking...' : 'Check Payment Status'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
