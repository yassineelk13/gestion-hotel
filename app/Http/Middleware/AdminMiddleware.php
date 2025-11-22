<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Récupérer l'utilisateur depuis le middleware JWT
        $user = $request->user ?? $request->get('user');
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non authentifié'
            ], 401);
        }

        // Vérifier le rôle admin (si le champ role existe)
        // Si pas de champ role, on accepte tous les utilisateurs authentifiés
        if (isset($user->role) && $user->role !== 'ADMIN') {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé. Rôle administrateur requis.'
            ], 403);
        }

        return $next($request);
    }
}
