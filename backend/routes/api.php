<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::get('/me', [AuthController::class, 'me'])->middleware(['auth:sanctum', 'throttle:60,1']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
