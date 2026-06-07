import { useState, useEffect } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';

export default function StudentAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [selected, setSelected]       = useState(null);
    const [submitting, setSubmitting]   = useState(false);
    const [form, setForm]               = useState({ notes: '', file: null });
    const [message, setMessage]         = useState('');

    useEffect(() => {
        portalApi.get('/assignments')
            .then(r => setAssignments(r.data))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        const formData = new FormData();
        formData.append('assignment_id', selected.id);
        formData.append('notes', form.notes);
        if (form.file) formData.append('file', form.file);

        try {
            await portalApi.post('/submissions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('✅ Submitted successfully!');
            setSelected(null);
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const typeColor = (type) => ({
        assignment: 'bg-blue-100 text-blue-700',
        homework:   'bg-purple-100 text-purple-700',
        test:       'bg-red-100 text-red-700',
        project:    'bg-orange-100 text-orange-700',
    }[type] ?? 'bg-gray-100 text-gray-600');

    if (loading) return <PortalLayout><div className="text-center py-20 text-gray-400">Loading...</div></PortalLayout>;

    return (
        <PortalLayout>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Assignments & Homework</h1>

            {assignments.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">No assignments posted yet</div>
            ) : (
                <div className="space-y-4">
                    {assignments.map(a => (
                        <div key={a.id} className="bg-white rounded-xl shadow-sm p-5">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{a.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{a.subject} — {a.school_class?.name}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColor(a.type)}`}>
                                    {a.type}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{a.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-orange-600 font-medium">
                                    Due: {new Date(a.due_date).toLocaleDateString()} | Marks: {a.total_marks}
                                </span>
                                <div className="flex gap-2">
                                    {a.attachment_path && (
                                        <a href={`http://127.0.0.1:8000/storage/${a.attachment_path}`}
                                            target="_blank" rel="noreferrer"
                                            className="text-blue-600 text-xs hover:underline">
                                            📎 Download
                                        </a>
                                    )}
                                    <button onClick={() => { setSelected(a); setMessage(''); setForm({ notes: '', file: null }); }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg">
                                        Submit Work
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Submit: {selected.title}</h2>
                            <button onClick={() => setSelected(null)} className="text-gray-400 text-xl">✕</button>
                        </div>

                        {message && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-4 text-sm">
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Answer</label>
                                <textarea rows={4} value={form.notes}
                                    onChange={e => setForm({...form, notes: e.target.value})}
                                    placeholder="Type your answer or notes here..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Attach File (PDF, DOC, Image)</label>
                                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.zip"
                                    onChange={e => setForm({...form, file: e.target.files[0]})}
                                    className="w-full text-sm text-gray-600" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setSelected(null)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                    {submitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}