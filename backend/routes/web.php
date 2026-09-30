<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\EventController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'Tixora API']));

// Web routes always receive session and CSRF middleware.
Route::prefix('web')->name('web.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1')->name('register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1')->name('login');
    Route::get('/events', [EventController::class, 'index'])->middleware('throttle:120,1');
    Route::get('/events/{slug}', [EventController::class, 'show'])->middleware('throttle:120,1');
    Route::middleware(['auth:web', 'throttle:30,1'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        Route::post('/events/{slug}/bookings', [BookingController::class, 'store']);
    });
});
