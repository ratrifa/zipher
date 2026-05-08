<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|min:8|max:50|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'public_key' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'public_key' => $request->public_key,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
            'message' => 'Registrasi berhasil.',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau Password salah',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
            'message' => 'Login berhasil.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->storage_used = $user->storageUsed();

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    public function getPublicKey(string $id): JsonResponse
    {
        $user = User::select('id', 'username', 'email', 'public_key')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        if (!User::where('email', $request->email)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email ditemukan.',
        ]);
    }

    public function verifyResetKey(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'       => 'required|email',
            'private_key' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak ditemukan.',
            ], 404);
        }

        $privKey = openssl_pkey_get_private($this->normalizePem($request->private_key));
        if (!$privKey) {
            return response()->json([
                'success' => false,
                'message' => 'Format kunci privat tidak valid.',
            ], 422);
        }

        $testData = 'zipher-reset-verify-' . $user->id;
        $signature = '';
        if (!openssl_sign($testData, $signature, $privKey, OPENSSL_ALGO_SHA256)) {
            return response()->json([
                'success' => false,
                'message' => 'Kunci privat tidak valid.',
            ], 422);
        }

        if (openssl_verify($testData, $signature, $this->normalizePem($user->public_key, true), OPENSSL_ALGO_SHA256) !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Kunci privat tidak cocok dengan akun ini.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Kunci privat valid.',
        ]);
    }

    private function normalizePem(string $key, bool $isPublic = false): string
    {
        $key = trim($key);
        if (str_starts_with($key, '-----')) {
            return $key;
        }
        $b64 = preg_replace('/\s+/', '', $key);
        $header = $isPublic ? 'PUBLIC KEY' : 'PRIVATE KEY';
        return "-----BEGIN {$header}-----\n" . chunk_split($b64, 64, "\n") . "-----END {$header}-----\n";
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'                 => 'required|email',
            'private_key'          => 'required|string',
            'password'             => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak ditemukan.',
            ], 404);
        }

        $privKey = openssl_pkey_get_private($this->normalizePem($request->private_key));
        if (!$privKey) {
            return response()->json([
                'success' => false,
                'message' => 'Format kunci privat tidak valid.',
            ], 422);
        }

        $testData = 'zipher-reset-verify-' . $user->id;
        $signature = '';
        if (!openssl_sign($testData, $signature, $privKey, OPENSSL_ALGO_SHA256)) {
            return response()->json([
                'success' => false,
                'message' => 'Kunci privat tidak valid.',
            ], 422);
        }

        if (openssl_verify($testData, $signature, $this->normalizePem($user->public_key, true), OPENSSL_ALGO_SHA256) !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Kunci privat tidak cocok dengan akun ini.',
            ], 422);
        }

        $user->forceFill(['password' => Hash::make($request->password)])->save();
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diperbarui.',
        ]);
    }

    public function searchUsers(Request $request): JsonResponse
    {
        $query = $request->query('q', '');
        $users = User::select('id', 'username', 'email', 'public_key')
            ->where('id', '!=', auth()->id())
            ->where(function($q) use ($query) {
                $q->where('username', 'LIKE', "%{$query}%")
                  ->orWhere('email', 'LIKE', "%{$query}%");
            })
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }
}
