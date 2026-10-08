<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssistantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CinemaController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::get('/me', [AuthController::class, 'me'])->middleware(['auth:sanctum', 'throttle:60,1']);
Route::patch('/settings', [SettingsController::class, 'update'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::delete('/account', [SettingsController::class, 'destroy'])->middleware(['auth:sanctum', 'throttle:5,1']);

Route::get('/events', [EventController::class, 'index'])->middleware('throttle:120,1');
Route::get('/events/{slug}', [EventController::class, 'show'])->middleware('throttle:120,1');
Route::post('/events/{slug}/bookings', [BookingController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:20,1']);

Route::get('/movies/{slug}/screenings', [CinemaController::class, 'screenings'])->middleware('throttle:120,1');
Route::get('/screenings/{screening}/seats', [CinemaController::class, 'seats'])->middleware('throttle:120,1');
Route::post('/screenings/{screening}/holds', [CinemaController::class, 'hold'])
    ->middleware(['auth:sanctum', 'throttle:20,1']);
Route::delete('/screenings/{screening}/holds/{holdToken}', [CinemaController::class, 'release'])
    ->middleware(['auth:sanctum', 'throttle:20,1']);
Route::post('/screenings/{screening}/review', [CinemaController::class, 'review'])
    ->middleware(['auth:sanctum', 'throttle:20,1']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware(['auth:sanctum', 'throttle:30,1'])->group(function () {

    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings/{booking}/checkout', [BookingController::class, 'checkout']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
    Route::post('/screenings/{screening}/bookings', [BookingController::class, 'cinema']);
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::put('/favorites/{slug}', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{slug}', [FavoriteController::class, 'destroy']);
    Route::get('/admin/events', [AdminController::class, 'index']);
    Route::post('/admin/images', [MediaController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/admin/overview', [AdminController::class, 'overview']);
    Route::get('/admin/bookings', [AdminController::class, 'bookings']);
    Route::get('/admin/customers', [AdminController::class, 'customers']);
    Route::post('/admin/events', [AdminController::class, 'store']);
    Route::post('/admin/events/{type}/{id}/tiers', [AdminController::class, 'saveTier']);
    Route::patch('/admin/events/{type}/{id}/tiers/{tier}', [AdminController::class, 'saveTier']);
    Route::delete('/admin/events/{type}/{id}/tiers/{tier}', [AdminController::class, 'deleteTier']);
    Route::patch('/admin/events/{type}/{id}', [AdminController::class, 'update']);
    Route::delete('/admin/events/{type}/{id}', [AdminController::class, 'destroy']);
});
Route::post('/payments/paymongo/webhook', [BookingController::class, 'webhook']);

Route::patch('/settings/credentials', [SettingsController::class, 'credentials'])->middleware(['auth:sanctum', 'throttle:5,1']);

Route::post('/assistant/chat', [AssistantController::class, 'chat'])->middleware('throttle:10,1');
Route::get('/media/{filename}', [MediaController::class, 'show'])->where('filename', '[a-f0-9-]+\\.(jpg|png|webp)')->middleware('throttle:120,1');
