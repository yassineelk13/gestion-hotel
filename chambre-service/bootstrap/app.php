<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // ✅ AUGMENTÉ À 10000 POUR LES TESTS DE CHARGE
            RateLimiter::for('api', function (Request $request) {
                return Limit::perMinute(10000)->by($request->user()?->id ?: $request->ip());
            });
        }
    )
    ->withMiddleware(function (Middleware $middleware) {

        // Middleware pour API
        $middleware->api(prepend: [
            // ✅ THROTTLE DÉSACTIVÉ POUR LES TESTS
            // \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // Alias de middleware personnalisés
        $middleware->alias([
            'jwt.verify' => \App\Http\Middleware\JwtMiddleware::class,
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
