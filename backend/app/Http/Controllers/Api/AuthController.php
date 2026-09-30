<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => strtolower(trim($request->input('email')))]);
        }
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:128', 'confirmed'],
        ]);

        $email = strtolower(trim($validated['email']));
        $name = trim($validated['name']);

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($validated['password']),
        ]);

        return $this->authenticatedResponse($request, $user, 'Registration successful', 201);
    }

    public function login(Request $request)
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => strtolower(trim($request->input('email')))]);
        }
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'max:128'],
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Incorrect Email or Password'],
            ]);
        }

        return $this->authenticatedResponse($request, $user, 'Login successful');
    }

    public function logout(Request $request)
    {
        if ($request->routeIs('web.*')) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        } else {
            $request->user()->currentAccessToken()?->delete();
        }

        return response()->json(['message' => 'Signed out successfully.']);

    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()])->header('Cache-Control', 'no-store');

    }

    private function authenticatedResponse(Request $request, User $user, string $message, int $status = 200)
    {
        $payload = ['message' => $message, 'user' => $user];
        if ($request->routeIs('web.*')) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        } else {
            $payload['token'] = $user->createToken('mobile', ['*'], now()->addHours(24))->plainTextToken;
        }

        return response()->json($payload, $status)->header('Cache-Control', 'no-store');
    }
}
