<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Chambre;
use App\Http\Requests\StoreChambreRequest;
use App\Http\Requests\UpdateChambreRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ChambreController extends Controller
{
    /**
     * GET /api/chambres
     * Liste toutes les chambres avec filtres optionnels
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Chambre::query();

            // Filtre par type
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filtre par statut
            if ($request->has('statut')) {
                $query->where('statut', $request->statut);
            }

            // Filtre par capacité
            if ($request->has('capacite_personne')) {
                $query->where('capacite_personne', '>=', $request->capacite_personne);
            }

            // Filtre par nombre de lits
            if ($request->has('nb_lits')) {
                $query->where('nb_lits', '>=', $request->nb_lits);
            }

            // Filtre par prix minimum
            if ($request->has('prix_min')) {
                $query->where('prix_par_nuit', '>=', $request->prix_min);
            }

            // Filtre par prix maximum
            if ($request->has('prix_max')) {
                $query->where('prix_par_nuit', '<=', $request->prix_max);
            }

            // Filtre par étage
            if ($request->has('etage')) {
                $query->where('etage', $request->etage);
            }

            // Filtre par vue
            if ($request->has('vue')) {
                $query->where('vue', 'LIKE', '%' . $request->vue . '%');
            }

            // Pagination
            $perPage = $request->get('per_page', 10);
            $chambres = $query->orderBy('numero')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $chambres,
                'message' => 'Liste des chambres récupérée avec succès'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des chambres: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des chambres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/chambres/search
     * Recherche chambres disponibles pour des dates données
     */
    public function search(Request $request): JsonResponse
    {
        try {
            // Autoriser appel sans dates (retourne alors les chambres actuellement libres)
            $request->validate([
                'date_debut' => 'nullable|date',
                'date_fin' => 'nullable|date',
                'type' => 'nullable|string|max:50',
                'capacite_personne' => 'nullable|integer|min:1',
                'nb_lits' => 'nullable|integer|min:1',
                'vue' => 'nullable|string|max:100',
            ]);

            // Si une seule des dates est fournie -> erreur
            if ($request->filled('date_debut') xor $request->filled('date_fin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les deux paramètres date_debut et date_fin doivent être fournis ensemble.',
                    'errors' => [
                        'date_debut' => $request->filled('date_debut') ? [] : ['Le champ date_debut est requis lorsque date_fin est présent.'],
                        'date_fin' => $request->filled('date_fin') ? [] : ['Le champ date_fin est requis lorsque date_debut est présent.'],
                    ]
                ], 422);
            }

            // Rechercher seulement les chambres libres
            $query = Chambre::where('statut', Chambre::STATUT_LIBRE);

            // Appliquer les filtres
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            if ($request->has('capacite_personne')) {
                $query->where('capacite_personne', '>=', $request->capacite_personne);
            }

            if ($request->has('nb_lits')) {
                $query->where('nb_lits', '>=', $request->nb_lits);
            }

            if ($request->has('vue')) {
                $query->where('vue', 'LIKE', '%' . $request->vue . '%');
            }

            $nombreNuits = null;

            // Si les deux dates sont fournies, valider les contraintes temporelles puis calculer le nombre de nuits
            if ($request->filled('date_debut') && $request->filled('date_fin')) {
                $dateDebut = new \DateTime($request->date_debut);
                $dateFin = new \DateTime($request->date_fin);

                // Validation manuelle pour conserver les règles précédentes
                $today = (new \DateTime())->setTime(0,0,0);
                if ($dateDebut < $today) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Erreur de validation',
                        'errors' => ['date_debut' => ['La date de début doit être aujourd\'hui ou ultérieure.']]
                    ], 422);
                }

                if ($dateFin <= $dateDebut) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Erreur de validation',
                        'errors' => ['date_fin' => ['La date de fin doit être postérieure à la date de début.']]
                    ], 422);
                }

                $nombreNuits = $dateDebut->diff($dateFin)->days;
            }

            // Récupérer chambres et, si applicable, calculer prix total
            $chambres = $query->get()->map(function ($chambre) use ($nombreNuits) {
                $item = [
                    'id_chambre' => $chambre->id_chambre,
                    'numero' => $chambre->numero,
                    'type' => $chambre->type,
                    'capacite_personne' => $chambre->capacite_personne,
                    'nb_lits' => $chambre->nb_lits,
                    'superficie' => $chambre->superficie,
                    'etage' => $chambre->etage,
                    'vue' => $chambre->vue,
                    'description' => $chambre->description,
                    'photo_url' => $chambre->photo_url,
                    'prix_par_nuit' => $chambre->prix_par_nuit,
                    'statut' => $chambre->statut,
                ];

                if (!is_null($nombreNuits)) {
                    $item['nombre_nuits'] = $nombreNuits;
                    $item['prix_total'] = round($chambre->prix_par_nuit * $nombreNuits, 2);
                } else {
                    $item['nombre_nuits'] = null;
                    $item['prix_total'] = null;
                }

                return $item;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'chambres' => $chambres,
                    'nombre_resultats' => $chambres->count(),
                    'criteres' => [
                        'date_debut' => $request->date_debut,
                        'date_fin' => $request->date_fin,
                        'nombre_nuits' => $nombreNuits,
                        'type' => $request->type,
                        'capacite_personne' => $request->capacite_personne,
                        'nb_lits' => $request->nb_lits,
                        'vue' => $request->vue,
                    ]
                ],
                'message' => $chambres->count() . ' chambre(s) disponible(s)'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la recherche: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/chambres
     * Créer une nouvelle chambre (Admin uniquement)
     */
    public function store(StoreChambreRequest $request): JsonResponse
    {
        try {
            $chambre = Chambre::create($request->validated());

            Log::info('Chambre créée', [
                'id_chambre' => $chambre->id_chambre,
                'numero' => $chambre->numero
            ]);

            return response()->json([
                'success' => true,
                'data' => $chambre,
                'message' => 'Chambre créée avec succès'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la chambre',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/chambres/{id}
     * Afficher une chambre spécifique
     */
    public function show(string $id): JsonResponse
    {
        try {
            $chambre = Chambre::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $chambre,
                'message' => 'Chambre récupérée avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Chambre introuvable',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/chambres/{id}
     * Modifier une chambre (Admin uniquement)
     */
    public function update(UpdateChambreRequest $request, string $id): JsonResponse
    {
        try {
            $chambre = Chambre::findOrFail($id);
            $chambre->update($request->validated());

            Log::info('Chambre modifiée', ['id_chambre' => $chambre->id_chambre]);

            return response()->json([
                'success' => true,
                'data' => $chambre,
                'message' => 'Chambre modifiée avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Chambre introuvable',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la modification: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/chambres/{id}
     * Supprimer une chambre (Admin uniquement)
     * Utilise le soft delete
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $chambre = Chambre::findOrFail($id);
            
            // Suppression logique (soft delete)
            $chambre->delete();

            Log::info('Chambre supprimée', ['id_chambre' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Chambre supprimée avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Chambre introuvable',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/chambres/{id}/statut
     * Changer le statut d'une chambre
     */
    public function updateStatut(Request $request, string $id): JsonResponse
    {
        try {
            $request->validate([
                'statut' => 'required|in:libre,occupee,maintenance,hors_service'
            ]);

            $chambre = Chambre::findOrFail($id);
            
            $ancienStatut = $chambre->statut;
            
            if (!$chambre->changerStatut($request->statut)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Statut invalide'
                ], 400);
            }

            Log::info('Statut chambre modifié', [
                'id_chambre' => $id,
                'ancien_statut' => $ancienStatut,
                'nouveau_statut' => $request->statut
            ]);

            return response()->json([
                'success' => true,
                'data' => $chambre,
                'message' => 'Statut modifié avec succès'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Chambre introuvable',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/chambres/stats/all
     * Statistiques des chambres (Admin)
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'total' => Chambre::count(),
                'libres' => Chambre::where('statut', Chambre::STATUT_LIBRE)->count(),
                'occupees' => Chambre::where('statut', Chambre::STATUT_OCCUPEE)->count(),
                'maintenance' => Chambre::where('statut', Chambre::STATUT_MAINTENANCE)->count(),
                'hors_service' => Chambre::where('statut', Chambre::STATUT_HORS_SERVICE)->count(),
                'par_type' => Chambre::select('type', \DB::raw('count(*) as total'))
                    ->groupBy('type')
                    ->get()
                    ->pluck('total', 'type'),
                'par_etage' => Chambre::select('etage', \DB::raw('count(*) as total'))
                    ->groupBy('etage')
                    ->orderBy('etage')
                    ->get()
                    ->pluck('total', 'etage'),
                'prix_moyen' => round(Chambre::avg('prix_par_nuit'), 2),
                'prix_min' => Chambre::min('prix_par_nuit'),
                'prix_max' => Chambre::max('prix_par_nuit'),
                'superficie_moyenne' => round(Chambre::avg('superficie'), 2),
                'capacite_totale' => Chambre::sum('capacite_personne'),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistiques récupérées avec succès'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur calcul statistiques: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/chambres/numero/{numero}
     * Rechercher par numéro de chambre
     */
    public function findByNumero(string $numero): JsonResponse
    {
        try {
            $chambre = Chambre::where('numero', $numero)->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $chambre,
                'message' => 'Chambre trouvée'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Chambre avec ce numéro introuvable',
            ], 404);
        }
    }
}
