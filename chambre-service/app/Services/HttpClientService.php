<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HttpClientService
{
    /**
     * Vérifier si une réservation existe (Service Réservations)
     */
    public function verifierReservation(int $reservationId, string $token): ?array
    {
        try {
            $url = env('SERVICE_RESERVATIONS_URL') . "/api/reservations/{$reservationId}";
            
            $response = Http::withToken($token)
                           ->timeout(10)
                           ->get($url);

            if ($response->successful()) {
                return $response->json();
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Erreur communication service réservations: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Vérifier si un utilisateur existe (Service Utilisateurs)
     */
    public function verifierUtilisateur(int $userId, string $token): ?array
    {
        try {
            $url = env('SERVICE_UTILISATEURS_URL') . "/api/utilisateurs/{$userId}";
            
            $response = Http::withToken($token)
                           ->timeout(10)
                           ->get($url);

            if ($response->successful()) {
                return $response->json();
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Erreur communication service utilisateurs: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Valider un token JWT auprès du service utilisateurs
     */
    public function validerToken(string $token): bool
    {
        try {
            $url = env('SERVICE_UTILISATEURS_URL') . "/api/auth/validate";
            
            $response = Http::withToken($token)
                           ->timeout(5)
                           ->post($url);

            return $response->successful();

        } catch (\Exception $e) {
            Log::error('Erreur validation token: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Partager la disponibilité des chambres avec un service externe (API partenaire)
     *
     * @param array $payload Données de disponibilité (format libre)
     * @param string|null $token Token d'autorisation si nécessaire
     * @return array|null Réponse JSON du partenaire ou null en cas d'erreur
     */
    public function partagerDisponibilite(array $payload, ?string $token = null): ?array
    {
        try {
            $base = env('SERVICE_PARTENAIRE_URL');
            if (empty($base)) {
                Log::warning('SERVICE_PARTENAIRE_URL non configuré, annulation du partage de disponibilité');
                return null;
            }

            $url = rtrim($base, '/') . '/api/partenaire/disponibilite';

            $client = Http::timeout(10);

            if ($token) {
                $client = $client->withToken($token);
            }

            $response = $client->post($url, $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Partage disponibilité non réussi, status: ' . $response->status());
            return null;

        } catch (\Exception $e) {
            Log::error('Erreur lors du partage de disponibilité: ' . $e->getMessage());
            return null;
        }
    }
}

