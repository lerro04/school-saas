import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';
import { CheckCircle, Download, X } from 'lucide-react';

export default function TeacherSubmissions() {
    const [searchParams] = useSearchParams();
    const [submissions, setSubmissions] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(searchParams.get('assignment_id') ?? '');
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ marks_awarded: '', teacher_feedback: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const loadSubmissions = useCallback(() => {
        const params = selectedAssignment ? { assignment_id: selectedAssignment } : {};
        setLoading(true);
        portalApi.get('/submissions', { params })
            .then(r => setSubmissions(r.data))
            .finally(() => setLoading(false));
    }, [selectedAssignment]);

    useEffect(() => {
        portalApi.get('/assignments').then(r => setAssignments(r.data));
    }, []);

    useEffect(() => {
        loadSubmissions();
    }, [loadSubmissions]);

    const selectedAssignmentTitle = useMemo(() => {
        if (!selectedAssignment) return 'All assignments';
        return assignments.find(a => String(a.id) === String(selectedAssignment))?.title ?? 'Selected assignment';
    }, [assignments, selectedAssignment]);

    const openGrade = (submission) => {
        setSelected(submission);
        setForm({
            marks_awarded: submission.marks_awarded ?? '',
            teacher_feedback: submission.teacher_feedback ?? '',
        });
        setMessage('');
    };

    const handleGrade = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await portalApi.post(`/submissions/${selected.id}/grade`, form);
            setSelected(null);
            setMessage('Submission graded successfully.');
            loadSubmissions();
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Failed to save grade');
        } finally {
            setSaving(false);
        }
    };

    const statusColor = (status) => ({
        submitted: 'bg-blue-100 text-blue-700',
        late: 'bg-orange-100 text-orange-700',
        graded: 'bg-green-100 text-green-700',
    }[status] ?? 'bg-gray-100 text-gray-600');

    return (
        <PortalLayout>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Submissions</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{selectedAssignmentTitle}</p>
                </div>
                <select value={selectedAssignment}
                    onChange={e => setSelectedAssignment(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">All assignments</option>
                    {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
            </div>

            {message && !selected && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                    <CheckCircle size={16} /> {message}
                </div>
            )}

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading...</div>
            ) : submissions.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">No submissions found</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {['Student', 'Assignment', 'Submitted', 'Status', 'Marks', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(s => (
                                <tr key={s.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {s.student ? `${s.student.first_name} ${s.student.last_name}` : 'Student'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{s.assignment?.title ?? '-'}</td>
                                    <td className="px-4 py-3 text-gray-500">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>{s.status}</span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold">
                                        {s.marks_awarded ?? '-'}{s.assignment?.total_marks ? ` / ${s.assignment.total_marks}` : ''}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {s.file_path && (
                                                <a href={`http://127.0.0.1:8000/storage/${s.file_path}`}
                                                    target="_blank" rel="noreferrer"
                                                    className="text-blue-600 hover:text-blue-800">
                                                    <Download size={15} />
                                                </a>
                                            )}
                                            <button onClick={() => openGrade(s)}
                                                className="text-purple-600 hover:text-purple-800 text-xs font-medium">
                                                Grade
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Grade Submission</h2>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 mb-4 text-sm">
                            <p className="font-medium text-purple-800">{selected.assignment?.title}</p>
                            <p className="text-purple-600">{selected.student ? `${selected.student.first_name} ${selected.student.last_name}` : 'Student'}</p>
                        </div>
                        {selected.notes && (
                            <div className="border border-gray-100 rounded-lg p-3 mb-4">
                                <p className="text-xs text-gray-500 mb-1">Student notes</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.notes}</p>
                            </div>
                        )}
                        {message && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{message}</div>}
                        <form onSubmit={handleGrade} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Marks Awarded</label>
                                <input required type="number" min="0" value={form.marks_awarded}
                                    onChange={e => setForm({...form, marks_awarded: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Feedback</label>
                                <textarea rows={4} value={form.teacher_feedback}
                                    onChange={e => setForm({...form, teacher_feedback: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Grade'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
