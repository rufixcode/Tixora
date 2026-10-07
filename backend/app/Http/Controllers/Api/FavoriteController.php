<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        $saved = DB::table('favorites')->where('user_id', $request->user()->id)->get()->map(fn ($f) => $f->favoritable_type.':'.$f->favoritable_id)->all();

        return response()->json(app(EventController::class)->catalog()->filter(fn ($e) => in_array($e['resource_type'].':'.$e['resource_id'], $saved))->values())->header('Cache-Control', 'no-store');
    }

    private function key(Request $request, string $slug): array
    {
        $event = app(EventController::class)->catalog()->firstWhere('slug', $slug);
        abort_unless($event, 404);

        return ['user_id' => $request->user()->id, 'favoritable_type' => $event['resource_type'], 'favoritable_id' => $event['resource_id']];
    }

    public function store(Request $request, string $slug)
    {
        DB::table('favorites')->insertOrIgnore([...$this->key($request, $slug), 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['saved' => true]);
    }

    public function destroy(Request $request, string $slug)
    {
        DB::table('favorites')->where($this->key($request, $slug))->delete();

        return response()->json(['saved' => false]);
    }
}
