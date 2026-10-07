<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CinemaController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'Tixora API']));

// Web routes always receive session and CSRF middleware.
Route::prefix('web')->name('web.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1')->name('register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1')->name('login');
    Route::get('/events', [EventController::class, 'index'])->middleware('throttle:120,1');
    Route::get('/events/{slug}', [EventController::class, 'show'])->middleware('throttle:120,1');
    Route::get('/movies/{slug}/screenings', [CinemaController::class, 'screenings'])->middleware('throttle:120,1');
    Route::get('/screenings/{screening}/seats', [CinemaController::class, 'seats'])->middleware('throttle:120,1');
    Route::middleware('auth:web')->group(function () {
        Route::middleware('throttle:30,1')->group(function () {

            Route::get('/bookings', [BookingController::class, 'index']);
            Route::post('/bookings/{booking}/checkout', [BookingController::class, 'checkout']);
            Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
            Route::post('/screenings/{screening}/bookings', [BookingController::class, 'cinema']);
            Route::get('/favorites', [FavoriteController::class, 'index']);
            Route::put('/favorites/{slug}', [FavoriteController::class, 'store']);
            Route::delete('/favorites/{slug}', [FavoriteController::class, 'destroy']);
            Route::get('/admin/events', [AdminController::class, 'index']);
            Route::get('/admin/overview', [AdminController::class, 'overview']);
            Route::get('/admin/bookings', [AdminController::class, 'bookings']);
            Route::get('/admin/customers', [AdminController::class, 'customers']);
            Route::post('/admin/events', [AdminController::class, 'store']);
            Route::patch('/admin/events/{type}/{id}', [AdminController::class, 'update']);
            Route::delete('/admin/events/{type}/{id}', [AdminController::class, 'destroy']);

            Route::post('/screenings/{screening}/holds', [CinemaController::class, 'hold']);
            Route::delete('/screenings/{screening}/holds/{holdToken}', [CinemaController::class, 'release']);
            Route::post('/screenings/{screening}/review', [CinemaController::class, 'review']);
        });

        Route::get('/me', [AuthController::class, 'me'])->middleware('throttle:30,1');
        Route::patch('/settings', [SettingsController::class, 'update'])->middleware('throttle:30,1');
        Route::patch('/settings/credentials', [SettingsController::class, 'credentials'])->middleware('throttle:5,1');
        Route::delete('/account', [SettingsController::class, 'destroy'])->middleware('throttle:5,1');
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('throttle:30,1')->name('logout');
        Route::post('/events/{slug}/bookings', [BookingController::class, 'store'])->middleware('throttle:30,1');
    });
});
