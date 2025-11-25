<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Chambre extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Nom de la table
     */
    protected $table = 'chambres';

    /**
     * Clé primaire personnalisée
     */
    protected $primaryKey = 'id_chambre';

    /**
     * Champs remplissables
     */
    protected $fillable = [
        'numero',
        'type',
        'capacite_personne',
        'nb_lits',
        'prix_par_nuit',
        'superficie',
        'etage',
        'vue',
        'description',
        'photo_url',
        'statut',
    ];

    /**
     * Cast des attributs
     */
    protected $casts = [
        'capacite_personne' => 'integer',
        'nb_lits' => 'integer',
        'prix_par_nuit' => 'double',
        'superficie' => 'double',
        'etage' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Attributs cachés (ne pas exposer dans l'API)
     */
    protected $hidden = [
        'deleted_at',
    ];

    /**
     * Statuts disponibles
     */
    const STATUT_LIBRE = 'libre';
    const STATUT_OCCUPEE = 'occupee';
    const STATUT_MAINTENANCE = 'maintenance';
    const STATUT_HORS_SERVICE = 'hors_service';

    /**
     * Types de chambres courants
     */
    const TYPE_STANDARD = 'Standard';
    const TYPE_DELUXE = 'Deluxe';
    const TYPE_SUITE = 'Suite';
    const TYPE_FAMILIALE = 'Familiale';

    /**
     * Scopes pour filtrer
     */
    public function scopeLibre($query)
    {
        return $query->where('statut', self::STATUT_LIBRE);
    }

    public function scopeOccupee($query)
    {
        return $query->where('statut', self::STATUT_OCCUPEE);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByCapacite($query, $capacite)
    {
        return $query->where('capacite_personne', '>=', $capacite);
    }

    public function scopeByEtage($query, $etage)
    {
        return $query->where('etage', $etage);
    }

    public function scopeByVue($query, $vue)
    {
        return $query->where('vue', 'LIKE', "%{$vue}%");
    }

    /**
     * Accesseurs
     */
    public function getPrixFormatAttribute(): string
    {
        return number_format($this->prix_par_nuit, 2) . ' MAD';
    }

    public function getSuperficieFormatAttribute(): string
    {
        return number_format($this->superficie, 2) . ' m²';
    }

    /**
     * Vérifier si la chambre est disponible
     */
    public function estLibre(): bool
    {
        return $this->statut === self::STATUT_LIBRE;
    }

    /**
     * Vérifier si la chambre est occupée
     */
    public function estOccupee(): bool
    {
        return $this->statut === self::STATUT_OCCUPEE;
    }

    /**
     * Changer le statut de la chambre
     */
    public function changerStatut(string $nouveauStatut): bool
    {
        $statutsValides = [
            self::STATUT_LIBRE,
            self::STATUT_OCCUPEE,
            self::STATUT_MAINTENANCE,
            self::STATUT_HORS_SERVICE
        ];

        if (!in_array($nouveauStatut, $statutsValides)) {
            return false;
        }

        $this->statut = $nouveauStatut;
        return $this->save();
    }

    /**
     * Marquer comme libre
     */
    public function liberer(): bool
    {
        return $this->changerStatut(self::STATUT_LIBRE);
    }

    /**
     * Marquer comme occupée
     */
    public function occuper(): bool
    {
        return $this->changerStatut(self::STATUT_OCCUPEE);
    }
}
