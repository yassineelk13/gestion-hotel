<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // ✅ Pour les routes API, retourner null (pas de redirection)
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        // Pour les routes web, rediriger vers login
        return route('login');
    }

    /**
     * ✅ Gérer la réponse non authentifiée pour l'API
     */
    protected function unauthenticated($request, array $guards)
    {
        // Si c'est une requête API, retourner JSON
        if ($request->expectsJson() || $request->is('api/*')) {
            abort(response()->json([
                'success' => false,
                'message' => 'Non authentifié. Token JWT requis.',
                'error' => 'unauthenticated'
            ], 401));
        }

        // Sinon, comportement par défaut (redirection web)
        parent::unauthenticated($request, $guards);
    }
}