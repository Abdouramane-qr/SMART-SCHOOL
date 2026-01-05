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
        Schema::table('absences', function (Blueprint $table) {
            $table->foreignId('classe_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('absences', function (Blueprint $table) {
            $table->dropConstrainedForeignId('classe_id');
            $table->dropConstrainedForeignId('academic_year_id');
        });
    }
};
