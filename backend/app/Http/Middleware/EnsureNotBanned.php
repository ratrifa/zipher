<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureNotBanned
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->is_banned) {
            return response()->json([
                'success' => false,
                'message' => 'This account has been banned.',
            ], 403);
        }

        return $next($request);
    }
}
