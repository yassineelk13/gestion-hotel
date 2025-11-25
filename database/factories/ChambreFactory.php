<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Chambre;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Chambre>
 */
class ChambreFactory extends Factory
{
    protected $model = Chambre::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'numero' => $this->faker->unique()->numberBetween(100, 999),
            'type' => $this->faker->randomElement(['Standard', 'Deluxe', 'Suite', 'Familiale']),
            'capacite_personne' => $this->faker->numberBetween(1, 5),
            'nb_lits' => $this->faker->numberBetween(1, 3),
            'prix_par_nuit' => $this->faker->randomFloat(2, 400, 2000),
            'superficie' => $this->faker->randomFloat(2, 20, 70),
            'etage' => $this->faker->numberBetween(1, 5),
            'vue' => $this->faker->randomElement(['Mer', 'Jardin', 'Piscine', 'Rue', 'Panoramique']),
            'description' => $this->faker->sentence(10),
            'photo_url' => $this->faker->imageUrl(640, 480, 'room', true),
            'statut' => 'libre',
        ];
    }

    /**
     * Chambre occupée
     */
    public function occupee(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'occupee',
        ]);
    }

    /**
     * Chambre en maintenance
     */
    public function maintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'maintenance',
        ]);
    }
}
