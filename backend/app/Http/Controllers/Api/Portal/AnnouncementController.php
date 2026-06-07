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

        return response()->json($query->limit(20)->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'    => 'required|string|max:255',
            'body'     => 'required|string',
            'audience' => 'required|in:all,students,parents,staff',
        ]);

        $data['posted_by']    = $request->user()->id;
        $data['published_at'] = now();

        $announcement = Announcement::create($data);
        return response()->json($announcement, 201);
    }

    public function show($id)
    {
        return response()->json(Announcement::findOrFail($id));
    }

    public function destroy($id)
    {
        Announcement::findOrFail($id)->delete();
        return response()->json(['message' => 'Announcement deleted']);
    }

    public function update(Request $request, $id) {}
}