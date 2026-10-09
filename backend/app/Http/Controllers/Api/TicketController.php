<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TicketController extends Controller
{
    public function check(Request $request)
    {
        abort_unless($request->user()->is_admin || $request->user()->is_security, 403, 'Ticket staff access required.');
        $data = $request->validate([
            'code' => ['required', 'string', 'regex:/^tixora:ticket:[a-zA-Z0-9]{48}$/'],
            'admit' => ['sometimes', 'boolean'],
            'password' => ['required_if:admit,true', 'nullable', 'string', 'max:128'],
        ]);
        if (($data['admit'] ?? false) && ! Hash::check($data['password'] ?? '', $request->user()->password)) {
            throw ValidationException::withMessages(['password' => 'Incorrect staff password.']);
        }

        return DB::transaction(function () use ($request, $data) {
            $ticket = DB::table('tickets')->where('qr_code', substr($data['code'], 14))->lockForUpdate()->first();
            abort_unless($ticket, 404, 'Ticket not found.');
            $booking = DB::table('bookings')->where('id', $ticket->booking_id)->first();
            abort_unless($booking && $booking->status === 'confirmed', 422, 'This booking is not confirmed.');
            if ($data['admit'] ?? false) {
                abort_unless($ticket->status === 'valid', 409, 'This ticket was already used or is no longer valid.');
                DB::table('tickets')->where('id', $ticket->id)->update(['status' => 'used', 'used_at' => now(), 'updated_at' => now()]);
                DB::table('ticket_verifications')->insert(['ticket_id' => $ticket->id, 'verified_by' => $request->user()->id, 'verified_at' => now(), 'result' => 'admitted', 'created_at' => now(), 'updated_at' => now()]);
                $ticket->status = 'used';
            }

            return response()->json(['ticket_number' => $ticket->ticket_number, 'event_title' => $booking->event_title, 'status' => $ticket->status, 'admitted' => (bool) ($data['admit'] ?? false)])->header('Cache-Control', 'no-store');
        });
    }
}
