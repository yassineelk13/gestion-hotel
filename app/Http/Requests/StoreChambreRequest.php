<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreChambreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization gérée par middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // Requis
            'numero' => 'required|string|max:10|unique:chambres,numero',
            'prix_par_nuit' => 'required|numeric|min:0',
            
            // Optionnels
            'type' => 'nullable|string|max:50',
            'capacite_personne' => 'nullable|integer|min:1|max:10',
            'nb_lits' => 'nullable|integer|min:1|max:5',
            'superficie' => 'nullable|numeric|min:0|max:200',
            'etage' => 'nullable|integer|min:0|max:20',
            'vue' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'photo_url' => 'nullable|url|max:255',
            'statut' => 'nullable|in:libre,occupee,maintenance,hors_service',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'numero.required' => 'Le numéro de chambre est obligatoire',
            'numero.unique' => 'Ce numéro de chambre existe déjà',
            'numero.max' => 'Le numéro ne peut pas dépasser 10 caractères',
            
            'prix_par_nuit.required' => 'Le prix par nuit est obligatoire',
            'prix_par_nuit.numeric' => 'Le prix doit être un nombre',
            'prix_par_nuit.min' => 'Le prix ne peut pas être négatif',
            
            'type.max' => 'Le type ne peut pas dépasser 50 caractères',
            
            'capacite_personne.integer' => 'La capacité doit être un nombre entier',
            'capacite_personne.min' => 'La capacité doit être au minimum 1',
            'capacite_personne.max' => 'La capacité ne peut pas dépasser 10 personnes',
            
            'nb_lits.integer' => 'Le nombre de lits doit être un nombre entier',
            'nb_lits.min' => 'Le nombre de lits doit être au minimum 1',
            'nb_lits.max' => 'Le nombre de lits ne peut pas dépasser 5',
            
            'superficie.numeric' => 'La superficie doit être un nombre',
            'superficie.min' => 'La superficie ne peut pas être négative',
            'superficie.max' => 'La superficie ne peut pas dépasser 200 m²',
            
            'etage.integer' => 'L\'étage doit être un nombre entier',
            'etage.min' => 'L\'étage ne peut pas être négatif',
            'etage.max' => 'L\'étage ne peut pas dépasser 20',
            
            'vue.max' => 'La vue ne peut pas dépasser 100 caractères',
            
            'description.max' => 'La description ne peut pas dépasser 500 caractères',
            
            'photo_url.url' => 'L\'URL de la photo doit être valide',
            'photo_url.max' => 'L\'URL ne peut pas dépasser 255 caractères',
            
            'statut.in' => 'Le statut doit être: libre, occupee, maintenance ou hors_service',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Erreur de validation',
            'errors' => $validator->errors()
        ], 422));
    }
}
