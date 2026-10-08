<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
        abort_unless(Storage::disk('public')->putFileAs('posters', $file, $filename), 503, 'Image storage is unavailable.');

        return response()->json(['image' => '/api/media/'.$filename], 201)->header('Cache-Control', 'no-store');
    }

    public function show(string $filename)
    {
        abort_unless(preg_match('/^[a-f0-9-]{36}\.(jpg|png|webp)$/D', $filename), 404);
        $disk = Storage::disk('public');
        abort_unless($disk->exists('posters/'.$filename), 404);

        return response()->file($disk->path('posters/'.$filename), [
            'X-Content-Type-Options' => 'nosniff', 'Content-Security-Policy' => "default-src 'none'; sandbox", 'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
