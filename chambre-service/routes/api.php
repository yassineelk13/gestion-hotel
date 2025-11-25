<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\ChambreController;
use App\Http\Controllers\API\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes - Service Chambres (Port 8082)
|--------------------------------------------------------------------------
*/

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

// Authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    
    // Protected routes
    Route::middleware(['jwt.verify'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Routes publiques (pas de JWT requis)
Route::prefix('chambres')->group(function () {
    // Liste toutes les chambres
    Route::get('/', [ChambreController::class, 'index']);
    
    // Recherche chambres disponibles avec dates
    Route::get('/search', [ChambreController::class, 'search']);
    
    // Alias pour disponibilité (même comportement que /search)
    Route::get('/disponibilite', [ChambreController::class, 'search']);
    
    // Détails d'une chambre par ID
    Route::get('/{id}', [ChambreController::class, 'show']);
    
    // Recherche par numéro de chambre
    Route::get('/numero/{numero}', [ChambreController::class, 'findByNumero']);
});

// Routes protégées (JWT requis - Admin uniquement)
Route::middleware(['jwt.verify', 'admin'])->prefix('chambres')->group(function () {
    // Créer une chambre
    Route::post('/', [ChambreController::class, 'store']);
    
    // Modifier une chambre
    Route::put('/{id}', [ChambreController::class, 'update']);
    
    // Supprimer une chambre (soft delete)
    Route::delete('/{id}', [ChambreController::class, 'destroy']);
    
    // Statistiques
    Route::get('/stats/all', [ChambreController::class, 'stats']);
});

// Route publique pour changer le statut (accessible sans JWT pour les réservations)
Route::put('/chambres/{id}/statut', [ChambreController::class, 'updateStatut']);