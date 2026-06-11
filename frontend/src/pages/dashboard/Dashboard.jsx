import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, UserCheck, DollarSign, AlertTriangle } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706'];

function StatCard({ label, value, sub, color, icon }) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        api.get('/reports/dashboard')
            .then(r => setData(r.data))
            .catch(err => {
                console.error(err);
                setError(err.response?.data?.message ?? 'Failed to load dashboard data');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>
        </Layout>
    );

    if (error) return (
        <Layout>
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                {error}
            </div>
        </Layout>
    );

    const feeChartData = data ? [
        { name: 'Invoiced',    amount: Number(data.fees.total_invoiced) },
        { name: 'Collected',   amount: Number(data.fees.total_collected) },
        { name: 'Outstanding', amount: Number(data.fees.total_outstanding) },
    ] : [];

    const invoiceStatusData = data ? [
        { name: 'Paid',    value: data.fees.total_invoiced - data.fees.total_outstanding },
        { name: 'Partial', value: data.fees.partial_invoices },
        { name: 'Unpaid',  value: data.fees.unpaid_invoices },
    ] : [];

    return (
        <Layout>
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Students"
                    value={data?.students.total ?? 0}
                    sub="Currently enrolled"
                    color="bg-blue-100"
                    icon={<Users size={22} className="text-blue-600" />}
                />
                <StatCard
                    label="Total Staff"
                    value={data?.staff.total ?? 0}
                    sub="Active staff members"
                    color="bg-green-100"
                    icon={<UserCheck size={22} className="text-green-600" />} 
                />
                <StatCard
                    label="Fees Collected"
                    value={`$${Number(data?.fees.total_collected ?? 0).toLocaleString()}`}
                    sub={`${data?.fees.collection_rate ?? 0}% collection rate`}
                    color="bg-emerald-100"
                    icon={<DollarSign size={22} className="text-emerald-600" />}
                />
                <StatCard
                    label="Outstanding"
                    value={`$${Number(data?.fees.total_outstanding ?? 0).toLocaleString()}`}
                    sub={`${data?.fees.unpaid_invoices ?? 0} unpaid invoices`}
                    color="bg-red-100"
                   icon={<AlertTriangle size={22} className="text-red-600" />}
                />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Fee Overview</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={feeChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                            <Bar dataKey="amount" fill="#2563eb" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Invoice Status</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={invoiceStatusData} cx="50%" cy="50%"
                                outerRadius={80} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                                {invoiceStatusData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent payments */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Recent Payments</h3>
                {data?.recent_payments?.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No payments recorded yet</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b">
                                <th className="pb-2">Receipt</th>
                                <th className="pb-2">Student</th>
                                <th className="pb-2">Amount</th>
                                <th className="pb-2">Method</th>
                                <th className="pb-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.recent_payments?.map((p, i) => (
                                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="py-2 font-mono text-blue-600">{p.receipt}</td>
                                    <td className="py-2">{p.student}</td>
                                    <td className="py-2 font-semibold">${Number(p.amount).toLocaleString()}</td>
                                    <td className="py-2">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs uppercase">
                                            {p.method}
                                        </span>
                                    </td>
                                    <td className="py-2 text-gray-400">
                                        {new Date(p.paid_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    );
}
