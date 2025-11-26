<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\ChambreController;
use App\Http\Controllers\API\AuthController;

// Health check
Route::get('/health', function () {
    return response()->json([
        'service' => 'service-chambres',
        'status' => 'up',
        'port' => 8082,
        'database' => 'DB_chambres',
        'timestamp' => now()
    ]);
});

// Authentication routes (si tu en as besoin plus tard)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    Route::middleware(['jwt.verify'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// ✅ TOUTES LES ROUTES CHAMBRES PUBLIQUES (pour l'instant)
Route::prefix('chambres')->group(function () {
    // Lecture
    Route::get('/', [ChambreController::class, 'index']);
    Route::get('/search', [ChambreController::class, 'search']);
    Route::get('/disponibilite', [ChambreController::class, 'search']);
    Route::get('/{id}', [ChambreController::class, 'show']);
    Route::get('/numero/{numero}', [ChambreController::class, 'findByNumero']);

    // ✅ Création, modification, suppression (sans JWT pour l'instant)
    Route::post('/', [ChambreController::class, 'store']);
    Route::put('/{id}', [ChambreController::class, 'update']);
    Route::delete('/{id}', [ChambreController::class, 'destroy']);

    // Statistiques
    Route::get('/stats/all', [ChambreController::class, 'stats']);
});

// Route pour changer le statut
Route::put('/chambres/{id}/statut', [ChambreController::class, 'updateStatut']);
