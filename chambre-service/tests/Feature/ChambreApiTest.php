<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Chambre;

class ChambreApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test : Lister toutes les chambres
     */
    public function test_can_list_all_chambres(): void
    {
        Chambre::factory()->count(5)->create();

        $response = $this->getJson('/api/chambres');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'data' => [
                             '*' => [
                                 'id_chambre',
                                 'numero',
                                 'type',
                                 'prix_par_nuit',
                                 'capacite_personne',
                                 'statut'
                             ]
                         ]
                     ],
                     'message'
                 ])
                 ->assertJson([
                     'success' => true
                 ]);
    }

    /**
     * Test : Récupérer une chambre spécifique
     */
    public function test_can_get_single_chambre(): void
    {
        $chambre = Chambre::factory()->create([
            'numero' => '101',
            'type' => 'Standard',
            'prix_par_nuit' => 450.00,
        ]);

        $response = $this->getJson("/api/chambres/{$chambre->id_chambre}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'numero' => '101',
                         'type' => 'Standard',
                         'prix_par_nuit' => 450.00,
                     ]
                 ]);
    }

    /**
     * Test : Rechercher chambres disponibles
     */
    public function test_can_search_available_chambres(): void
    {
        Chambre::factory()->create([
            'type' => 'Deluxe',
            'capacite_personne' => 2,
            'statut' => 'libre',
        ]);

        $response = $this->getJson('/api/chambres/search?' . http_build_query([
            'date_debut' => now()->addDay()->format('Y-m-d'),
            'date_fin' => now()->addDays(3)->format('Y-m-d'),
            'type' => 'Deluxe',
        ]));

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'chambres',
                         'nombre_resultats',
                         'criteres'
                     ]
                 ]);
    }

    /**
     * Test : Filtrer par type
     */
    public function test_can_filter_chambres_by_type(): void
    {
        Chambre::factory()->create(['type' => 'Standard']);
        Chambre::factory()->create(['type' => 'Deluxe']);
        Chambre::factory()->create(['type' => 'Suite']);

        $response = $this->getJson('/api/chambres?type=Standard');

        $response->assertStatus(200);
        
        $chambres = $response->json('data.data');
        foreach ($chambres as $chambre) {
            $this->assertEquals('Standard', $chambre['type']);
        }
    }

    /**
     * Test : Filtrer par capacité
     */
    public function test_can_filter_by_capacite(): void
    {
        Chambre::factory()->create(['capacite_personne' => 2]);
        Chambre::factory()->create(['capacite_personne' => 4]);

        $response = $this->getJson('/api/chambres?capacite_personne=3');

        $response->assertStatus(200);
        
        $chambres = $response->json('data.data');
        foreach ($chambres as $chambre) {
            $this->assertGreaterThanOrEqual(3, $chambre['capacite_personne']);
        }
    }

    /**
     * Test : Chambre inexistante retourne 404
     */
    public function test_get_nonexistent_chambre_returns_404(): void
    {
        $response = $this->getJson('/api/chambres/99999');

        $response->assertStatus(404)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Chambre introuvable'
                 ]);
    }

    /**
     * Test : Validation échoue si données invalides
     * ✅ Désactiver le middleware JWT pour ce test
     */
    public function test_create_chambre_fails_with_invalid_data(): void
    {
        // ✅ Désactiver TOUS les middlewares pour tester uniquement la validation
        $this->withoutMiddleware([
            \App\Http\Middleware\JwtMiddleware::class,
            \App\Http\Middleware\AdminMiddleware::class,
        ]);

        $data = [
            'numero' => '', // Vide - invalide
            'prix_par_nuit' => -100, // Négatif - invalide
        ];

        $response = $this->postJson('/api/chambres', $data);

        $response->assertStatus(422)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'errors'
                 ]);
    }

    /**
     * Test : Recherche par numéro
     */
    public function test_can_find_chambre_by_numero(): void
    {
        $chambre = Chambre::factory()->create([
            'numero' => '999'
        ]);

        $response = $this->getJson('/api/chambres/numero/999');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'numero' => '999'
                     ]
                 ]);
    }
}