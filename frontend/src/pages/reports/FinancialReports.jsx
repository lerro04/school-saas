import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { BarChart3, LineChart, PieChart } from 'lucide-react';

export default function FinancialReports() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('comprehensive');
    const [dateFrom, setDateFrom] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    const [comprehensiveData, setComprehensiveData] = useState(null);
    const [financialData, setFinancialData] = useState(null);
    const [expenseStatusData, setExpenseStatusData] = useState(null);

    const fetchReports = async () => {
        setLoading(true);
        setError('');
        try {
            const params = { date_from: dateFrom, date_to: dateTo };
            const [comprehensive, financial, expenseStatus] = await Promise.all([
                api.get('/reports/comprehensive-financial', { params }),
                api.get('/reports/financial-summary', { params }),
                api.get('/reports/expense-status'),
            ]);
            setComprehensiveData(comprehensive.data);
            setFinancialData(financial.data);
            setExpenseStatusData(expenseStatus.data);
        } catch (err) {
            setError('Failed to load financial reports');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDateChange = () => {
        fetchReports();
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <h1 className="text-3xl font-bold">Financial Reports</h1>
                </div>

                {/* Date Filter */}
                <div className="mb-6 bg-white rounded-lg shadow p-4 flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="block text-sm font-semibold mb-1">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="border rounded px-3 py-2"
                        />
                    </div>
                    <button
                        onClick={handleDateChange}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Generate Report
                    </button>
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}

                {loading ? (
                    <div className="text-center py-8">Loading reports...</div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 border-b">
                            <button
                                onClick={() => setActiveTab('comprehensive')}
                                className={`px-4 py-2 font-semibold border-b-2 ${
                                    activeTab === 'comprehensive'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Comprehensive
                            </button>
                            <button
                                onClick={() => setActiveTab('financial')}
                                className={`px-4 py-2 font-semibold border-b-2 ${
                                    activeTab === 'financial'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Financial Summary
                            </button>
                            <button
                                onClick={() => setActiveTab('expenses')}
                                className={`px-4 py-2 font-semibold border-b-2 ${
                                    activeTab === 'expenses'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Expense Status
                            </button>
                        </div>

                        {/* Comprehensive Report */}
                        {activeTab === 'comprehensive' && comprehensiveData && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-gray-600 text-sm">Total Income</p>
                                        <p className="text-3xl font-bold text-blue-600">
                                            ${parseFloat(comprehensiveData.income.total_income).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Fees + Other Revenues</p>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-gray-600 text-sm">Total Expenses</p>
                                        <p className="text-3xl font-bold text-red-600">
                                            ${parseFloat(comprehensiveData.expenses.total_expenses).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Payroll + Operations</p>
                                    </div>
                                    <div className={`border-2 rounded-lg p-4 ${
                                        parseFloat(comprehensiveData.cash_flow.net_cash_flow) >= 0
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                    }`}>
                                        <p className="text-gray-600 text-sm">Net Cash Flow</p>
                                        <p className={`text-3xl font-bold ${
                                            parseFloat(comprehensiveData.cash_flow.net_cash_flow) >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}>
                                            ${parseFloat(comprehensiveData.cash_flow.net_cash_flow).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Income Breakdown */}
                                <div className="bg-white rounded-lg shadow p-4">
                                    <h3 className="text-lg font-bold mb-4">Income Breakdown</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fees Collected:</span>
                                            <span className="font-semibold">${parseFloat(comprehensiveData.income.fees_collected).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Other Revenues:</span>
                                            <span className="font-semibold">${parseFloat(comprehensiveData.income.other_revenues).toFixed(2)}</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between font-bold">
                                            <span>Total Income:</span>
                                            <span>${parseFloat(comprehensiveData.income.total_income).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expense Breakdown */}
                                <div className="bg-white rounded-lg shadow p-4">
                                    <h3 className="text-lg font-bold mb-4">Expense Breakdown</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payroll:</span>
                                            <span className="font-semibold">${parseFloat(comprehensiveData.expenses.payroll).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Operational Expenses:</span>
                                            <span className="font-semibold">${parseFloat(comprehensiveData.expenses.operational).toFixed(2)}</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between font-bold">
                                            <span>Total Expenses:</span>
                                            <span>${parseFloat(comprehensiveData.expenses.total_expenses).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Financial Summary */}
                        {activeTab === 'financial' && financialData && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-gray-600 text-sm">Total Revenues</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            ${parseFloat(financialData.summary.total_revenues).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                        <p className="text-gray-600 text-sm">Total Expenses</p>
                                        <p className="text-3xl font-bold text-orange-600">
                                            ${parseFloat(financialData.summary.total_expenses).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className={`border-2 rounded-lg p-4 ${
                                        parseFloat(financialData.summary.net_profit) >= 0
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                    }`}>
                                        <p className="text-gray-600 text-sm">Net Profit</p>
                                        <p className={`text-3xl font-bold ${
                                            parseFloat(financialData.summary.net_profit) >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}>
                                            ${parseFloat(financialData.summary.net_profit).toFixed(2)}
                                        </p>
                                        <p className="text-xs mt-1">Margin: {financialData.summary.profit_margin}%</p>
                                    </div>
                                </div>

                                {/* Revenue by Source */}
                                <div className="bg-white rounded-lg shadow p-4">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <PieChart className="w-5 h-5" /> Revenue by Source
                                    </h3>
                                    <div className="space-y-2">
                                        {financialData.revenues_by_source.map(r => (
                                            <div key={r.source} className="flex justify-between items-center">
                                                <span className="text-gray-600 capitalize">{r.source}</span>
                                                <span className="font-semibold">${parseFloat(r.total).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Expenses by Category */}
                                <div className="bg-white rounded-lg shadow p-4">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <LineChart className="w-5 h-5" /> Expenses by Category
                                    </h3>
                                    <div className="space-y-2">
                                        {financialData.expenses_by_category.map(e => (
                                            <div key={e.category} className="flex justify-between items-center">
                                                <span className="text-gray-600 capitalize">{e.category}</span>
                                                <span className="font-semibold">${parseFloat(e.total).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expense Status */}
                        {activeTab === 'expenses' && expenseStatusData && (
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-lg font-bold mb-4">Expense Status Overview</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {expenseStatusData.map(status => (
                                        <div key={status.status} className="border rounded-lg p-4 text-center">
                                            <p className="text-sm text-gray-600 capitalize">{status.status}</p>
                                            <p className="text-2xl font-bold text-blue-600">{status.count}</p>
                                            <p className="text-sm font-semibold text-gray-700">
                                                ${parseFloat(status.total_amount).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
