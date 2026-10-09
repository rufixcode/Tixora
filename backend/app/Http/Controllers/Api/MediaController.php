<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function store(Request $request)
    {
        abort_unless($request->user()->is_admin, 403, 'Administrator access required.');
        $request->validate(['image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:max_width=4096,max_height=4096']]);
        $file = $request->file('image');
        $extension = match ($file->getMimeType()) {
            'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', default => abort(422, 'Use a JPG, PNG or WebP image.')
        };
        $filename = Str::uuid().'.'.$extension;
        // Render's local filesystem is ephemeral. Keep small validated posters
        // in the persistent database so deployments cannot erase uploads.
        DB::table('poster_images')->insert([
            'filename' => $filename, 'mime_type' => $file->getMimeType(),
            'content' => base64_encode($file->getContent()), 'created_at' => now(),
        ]);

        return response()->json(['image' => '/api/media/'.$filename], 201)->header('Cache-Control', 'no-store');
    }

    public function show(string $filename)
    {
        abort_unless(preg_match('/^[a-f0-9-]{36}\.(jpg|png|webp)$/D', $filename), 404);
        $image = DB::table('poster_images')->where('filename', $filename)->first();
        if ($image) {
            return response(base64_decode($image->content, true), 200, [
                'Content-Type' => $image->mime_type,
                'X-Content-Type-Options' => 'nosniff',
                'Content-Security-Policy' => "default-src 'none'; sandbox",
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }
        $disk = Storage::disk('public');
        abort_unless($disk->exists('posters/'.$filename), 404);

        return response()->file($disk->path('posters/'.$filename), [
            'X-Content-Type-Options' => 'nosniff', 'Content-Security-Policy' => "default-src 'none'; sandbox", 'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
