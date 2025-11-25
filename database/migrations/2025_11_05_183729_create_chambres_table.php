<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chambres', function (Blueprint $table) {
            // 1. id_chambre - AUTO_INCREMENT PRIMARY KEY
            $table->id('id_chambre');
            
            // 2. capacite_personne - INT(11) NULL
            $table->integer('capacite_personne')->nullable();
            
            // 3. description - VARCHAR(500) NULL
            $table->string('description', 500)->nullable();
            
            // 4. etage - INT(11) NULL
            $table->integer('etage')->nullable();
            
            // 5. nb_lits - INT(11) NULL
            $table->integer('nb_lits')->nullable();
            
            // 6. numero - VARCHAR(10) - Pas de défaut (requis)
            $table->string('numero', 10)->unique();
            
            // 7. photo_url - VARCHAR(255) NULL
            $table->string('photo_url', 255)->nullable();
            
            // 8. prix_par_nuit - DOUBLE - Pas de défaut
            $table->double('prix_par_nuit');
            
            // 9. statut - VARCHAR(50) - Défaut: 'libre'
            $table->string('statut', 50)->default('libre');
            
            // 10. superficie - DOUBLE NULL
            $table->double('superficie')->nullable();
            
            // 11. type - VARCHAR(50) NULL
            $table->string('type', 50)->nullable();
            
            // 12. vue - VARCHAR(100) NULL
            $table->string('vue', 100)->nullable();
            
            // 13. deleted_at - TIMESTAMP NULL (soft delete)
            $table->timestamp('deleted_at')->nullable();
            
            // Timestamps Laravel (created_at, updated_at)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chambres');
    }
};
