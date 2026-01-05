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
        Schema::table('notes', function (Blueprint $table) {
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete()->after('matiere_id');
            $table->string('grade_type')->nullable()->after('term');
            $table->decimal('weight', 5, 2)->nullable()->after('grade_type');
            $table->text('description')->nullable()->after('weight');
            $table->date('evaluation_date')->nullable()->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('class_id');
            $table->dropColumn(['grade_type', 'weight', 'description', 'evaluation_date']);
        });
    }
};
