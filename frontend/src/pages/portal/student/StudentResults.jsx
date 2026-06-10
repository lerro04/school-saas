import { useState, useEffect } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';
import { Lock } from 'lucide-react';


export default function StudentResults() {
    const [results, setResults]         = useState([]);
    const [locked, setLocked]           = useState(false);
    const [balance, setBalance]         = useState(0);
    const [loading, setLoading]         = useState(true);

    useEffect(() => {
        portalApi.get('/student/dashboard')
            .then(r => {
                setResults(r.data.results ?? []);
                setLocked(r.data.results_locked ?? false);
                setBalance(r.data.total_balance ?? 0);
            })
            .finally(() => setLoading(false));
    }, []);

    const gradeColor = (grade) => ({
        'A': 'bg-green-100 text-green-700',
        'B': 'bg-blue-100 text-blue-700',
        'C': 'bg-yellow-100 text-yellow-700',
        'D': 'bg-orange-100 text-orange-700',
        'E': 'bg-red-100 text-red-700',
        'U': 'bg-red-200 text-red-800',
    }[grade] ?? 'bg-gray-100 text-gray-600');

    if (loading) return (
        <PortalLayout>
            <div className="text-center py-20 text-gray-400">Loading...</div>
        </PortalLayout>
    );

    return (
        <PortalLayout>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">My Results</h1>

            {/* Outstanding fees warning */}
            {locked && (
               <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
    <Lock size={22} className="text-red-500 mt-0.5 flex-shrink-0" />
    <div>
        <p className="font-semibold text-red-700">Results Locked — Outstanding Fees</p>
        <p className="text-sm text-red-600 mt-0.5">
            Your results are locked because you have an outstanding balance of{' '}
            <strong>${Number(balance).toLocaleString()}</strong>.
            Please clear your fees to view your full results.
        </p>
        <a href="/portal/student/fees"
            className="inline-block mt-2 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg transition">
            Pay Fees Now →
        </a>
    </div>
</div>
            )}

            {results.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                    No results published yet
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {['Subject', 'Term', 'Year', 'Score', 'Grade', 'Remarks'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(r => (
                                <tr key={r.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium text-gray-800">{r.subject}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.term}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.academic_year}</td>
                                    <td className="px-4 py-3">
    {locked ? (
        <span className="flex items-center gap-1 text-gray-400">
            <Lock size={14} />
            <span className="blur-sm select-none">00</span>
        </span>
    ) : (
        <span className="font-bold">{r.score ?? '—'}</span>
    )}
</td>
                                    <td className="px-4 py-3">
                                        {locked ? (
                                            <span className="blur-sm select-none bg-gray-100 px-2 py-0.5 rounded-full text-xs">A</span>
                                        ) : r.grade ? (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor(r.grade)}`}>
                                                {r.grade}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {locked ? (
                                            <span className="blur-sm select-none text-gray-400">Hidden</span>
                                        ) : (r.remarks ?? '—')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {locked && (
                        <div className="px-4 py-3 bg-red-50 border-t border-red-100 text-center flex items-center justify-center gap-2">
    <Lock size={14} className="text-red-500" />
    <p className="text-xs text-red-600">Scores and grades are hidden until fees are cleared.</p>
</div>
                    )}
                </div>
            )}
        </PortalLayout>
    );
}
