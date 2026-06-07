import { useState, useEffect } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';

export default function StudentResults() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        portalApi.get('/student/dashboard')
            .then(r => setResults(r.data.results ?? []))
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

    if (loading) return <PortalLayout><div className="text-center py-20 text-gray-400">Loading...</div></PortalLayout>;

    return (
        <PortalLayout>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">My Results</h1>
            {results.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">No results published yet</div>
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
                                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-800">{r.subject}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.term}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.academic_year}</td>
                                    <td className="px-4 py-3 font-bold">{r.score ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {r.grade && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor(r.grade)}`}>
                                                {r.grade}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{r.remarks ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </PortalLayout>
    );
}