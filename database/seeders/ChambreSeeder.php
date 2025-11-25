<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChambreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $chambres = [
            [
                'numero' => '101',
                'type' => 'Standard',
                'capacite_personne' => 2,
                'nb_lits' => 1,
                'prix_par_nuit' => 450.00,
                'superficie' => 25.5,
                'etage' => 1,
                'vue' => 'Jardin',
                'description' => 'Chambre standard confortable avec vue sur le jardin',
                'photo_url' => 'https://example.com/photos/chambre-101.jpg',
                'statut' => 'libre',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero' => '102',
                'type' => 'Standard',
                'capacite_personne' => 2,
                'nb_lits' => 2,
                'prix_par_nuit' => 500.00,
                'superficie' => 28.0,
                'etage' => 1,
                'vue' => 'Piscine',
                'description' => 'Chambre double avec deux lits simples et vue piscine',
                'photo_url' => 'https://example.com/photos/chambre-102.jpg',
                'statut' => 'libre',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero' => '201',
                'type' => 'Deluxe',
                'capacite_personne' => 3,
                'nb_lits' => 2,
                'prix_par_nuit' => 750.00,
                'superficie' => 35.0,
                'etage' => 2,
                'vue' => 'Mer',
                'description' => 'Chambre deluxe spacieuse avec vue mer panoramique',
                'photo_url' => 'https://example.com/photos/chambre-201.jpg',
                'statut' => 'libre',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero' => '301',
                'type' => 'Suite',
                'capacite_personne' => 4,
                'nb_lits' => 2,
                'prix_par_nuit' => 1200.00,
                'superficie' => 55.0,
                'etage' => 3,
                'vue' => 'Mer',
                'description' => 'Suite luxueuse avec salon séparé et terrasse privée',
                'photo_url' => 'https://example.com/photos/chambre-301.jpg',
                'statut' => 'libre',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero' => '302',
                'type' => 'Suite',
                'capacite_personne' => 5,
                'nb_lits' => 3,
                'prix_par_nuit' => 1500.00,
                'superficie' => 65.0,
                'etage' => 3,
                'vue' => 'Panoramique',
                'description' => 'Suite familiale avec vue panoramique à 360 degrés',
                'photo_url' => 'https://example.com/photos/chambre-302.jpg',
                'statut' => 'libre',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero' => '202',
                'type' => 'Deluxe',
                'capacite_personne' => 2,
                'nb_lits' => 1,
                'prix_par_nuit' => 700.00,
                'superficie' => 32.0,
                'etage' => 2,
                'vue' => 'Jardin',
                'description' => 'Chambre deluxe en cours de rénovation',
                'photo_url' => 'https://example.com/photos/chambre-202.jpg',
                'statut' => 'maintenance',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero' => '103',
                'type' => 'Standard',
                'capacite_personne' => 2,
                'nb_lits' => 1,
                'prix_par_nuit' => 450.00,
                'superficie' => 24.0,
                'etage' => 1,
                'vue' => 'Rue',
                'description' => 'Chambre standard économique',
                'photo_url' => 'https://example.com/photos/chambre-103.jpg',
                'statut' => 'occupee',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('chambres')->insert($chambres);
    }
}
