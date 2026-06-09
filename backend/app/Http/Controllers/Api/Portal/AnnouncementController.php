<?php

namespace App\Http\Controllers\Api\Portal;

use Illuminate\Routing\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $query = Announcement::where('is_published', true)
            ->where(function($q) use ($request) {
                $q->where('audience', 'all')
                  ->orWhere('audience', $request->audience ?? 'all');
            })->orderBy('created_at', 'desc');

        return response()->json($query->limit(50)->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'      => 'required|string|max:255',
            'body'       => 'required|string',
            'audience'   => 'required|in:all,students,parents,staff',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx,png,jpg,zip|max:10240',
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $data['attachment_path'] = $file->store('announcements', 'public');
            $data['attachment_name'] = $file->getClientOriginalName();
        }

        $data['posted_by']    = $request->user()->id;
        $data['published_at'] = now();

        unset($data['attachment']);
        $announcement = Announcement::create($data);
        return response()->json($announcement, 201);
    }

    public function show($id)
    {
        return response()->json(Announcement::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);

        $data = $request->validate([
            'title'      => 'sometimes|string|max:255',
            'body'       => 'sometimes|string',
            'audience'   => 'sometimes|in:all,students,parents,staff',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx,png,jpg,zip|max:10240',
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $data['attachment_path'] = $file->store('announcements', 'public');
            $data['attachment_name'] = $file->getClientOriginalName();
        }

        unset($data['attachment']);
        $announcement->update($data);
        return response()->json($announcement);
    }

    public function destroy($id)
    {
        Announcement::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}