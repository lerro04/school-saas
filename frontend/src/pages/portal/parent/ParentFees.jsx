import { useEffect, useState } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';
import { X } from 'lucide-react';

export default function ParentFees() {
    const [fees, setFees] = useState([]);
    const [child, setChild] = useState(null);
    const [totalBalance, setTotalBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [paying, setPaying] = useState(false);
    const [polling, setPolling] = useState(false);
    const [pollUrl, setPollUrl] = useState(null);
    const [message, setMessage] = useState('');
    const [payForm, setPayForm] = useState({ phone: '', method: 'ecocash' });

    const loadFees = () => {
        portalApi.get('/parent/dashboard')
            .then(r => {
                setFees(r.data.fees ?? []);
                setChild(r.data.child ?? null);
                setTotalBalance(r.data.total_balance ?? 0);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadFees();
    }, []);

    const statusColor = (s) => s === 'paid' ? 'bg-green-100 text-green-700' :
        s === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

    const handlePay = async (e) => {
        e.preventDefault();
        setPaying(true);
        setMessage('');
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
                setSelected(null);
                setPollUrl(null);
                setMessage('');
                loadFees();
            } else {
                setMessage(`Status: ${r.data.status}. Complete payment then check again.`);
            }
        } finally {
            setPolling(false);
        }
    };

    if (loading) return <PortalLayout><div className="text-center py-20 text-gray-400">Loading...</div></PortalLayout>;

    return (
        <PortalLayout>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fees</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {child ? `${child.first_name} ${child.last_name} - ${child.student_number}` : 'Fee statements'}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm px-5 py-3 text-right">
                    <p className="text-xs text-gray-500">Outstanding Balance</p>
                    <p className="text-xl font-bold text-red-600">${Number(totalBalance).toLocaleString()}</p>
                </div>
            </div>

            {fees.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">No fee invoices found</div>
            ) : (
                <div className="space-y-4">
                    {fees.map(fee => (
                        <div key={fee.id} className="bg-white rounded-xl shadow-sm p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-semibold text-gray-800">{fee.term}</p>
                                    <p className="text-xs text-gray-500">Invoice #{fee.invoice_number}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(fee.status)}`}>
                                    {fee.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                <div><p className="text-gray-500 text-xs">Total</p><p className="font-bold">${Number(fee.total_amount).toLocaleString()}</p></div>
                                <div><p className="text-gray-500 text-xs">Paid</p><p className="font-bold text-green-600">${Number(fee.amount_paid).toLocaleString()}</p></div>
                                <div><p className="text-gray-500 text-xs">Balance</p><p className="font-bold text-red-600">${Number(fee.balance).toLocaleString()}</p></div>
                            </div>
                            {fee.status !== 'paid' && (
                                <button onClick={() => { setSelected(fee); setPollUrl(null); setMessage(''); }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
                                    Pay Now
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Pay Fees</h2>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
                            <p className="font-medium text-blue-800">{selected.term}</p>
                            <p className="text-blue-600">Balance: <strong>${Number(selected.balance).toLocaleString()}</strong></p>
                        </div>
                        {message && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">{message}</div>}
                        {!pollUrl ? (
                            <form onSubmit={handlePay} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
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
