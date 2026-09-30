<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\EventController;
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

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
