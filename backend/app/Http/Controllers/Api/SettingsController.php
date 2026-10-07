<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    public function update(Request $request)
    {
        foreach (['name', 'username'] as $field) {
            if (is_string($request->input($field))) {
                $value = trim($request->input($field));
                $request->merge([$field => $field === 'username' ? strtolower($value) : $value]);
            }
        }
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:255'],
            'username' => ['sometimes', 'nullable', 'string', 'min:3', 'max:30', 'regex:/^[a-z0-9_]+$/', Rule::unique('users')->ignore($request->user()->id)],
            'preferences' => ['sometimes', 'required', 'array:favorite_category'],
            'preferences.favorite_category' => ['required_with:preferences', Rule::in(['All', 'Concerts', 'Movies', 'Events'])],
        ]);
        $request->user()->update($data);

        return response()->json(['user' => $request->user()->fresh(), 'message' => 'Settings saved.'])->header('Cache-Control', 'no-store');
    }

    public function credentials(Request $request)
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => strtolower(trim($request->input('email')))]);
        }
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($request->user()->id)],
            'current_password' => ['required', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:12', 'max:128', 'confirmed'],
        ]);
        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => ['The current password is incorrect.']]);
        }
        DB::transaction(function () use ($user, $data) {
            if ($data['email'] !== $user->email) {
                $user->email_verified_at = null;
            }
            $user->email = $data['email'];
            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }
            $user->save();
            $user->tokens()->delete();
            DB::table('sessions')->where('user_id', $user->id)->delete();
        });
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Login details updated. Sign in again.'])->header('Cache-Control', 'no-store');
    }

    public function destroy(Request $request)
    {
        $data = $request->validate(['password' => ['required', 'string'], 'confirmation' => ['required', Rule::in(['DELETE'])]]);
        $user = $request->user();
        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => ['The password is incorrect.']]);
        }
        abort_if(DB::table('bookings')->where('user_id', $user->id)->whereIn('status', ['pending', 'confirmed'])->exists(), 422, 'Accounts with active payments or tickets cannot be deleted. Cancel pending bookings or contact support.');
        DB::transaction(function () use ($user, $request) {
            if ($request->hasSession()) {
                Auth::guard('web')->logout();
            }
            $user->tokens()->delete();
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $user->delete();
        });
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Account deleted.']);
    }
}
