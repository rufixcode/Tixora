<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    public function store(): JsonResponse
    {
        // Fail closed until inventory locking, seat ownership, idempotency and
        // verified payment confirmation are implemented together.
        return response()->json([
            'message' => 'Booking is not available yet. Please check back later.',
        ], 503)->header('Cache-Control', 'no-store');
    }
}
