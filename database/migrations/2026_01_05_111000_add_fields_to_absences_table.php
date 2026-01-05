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
            $table->date('absence_date')->nullable();
            $table->string('absence_type')->default('absence');
            $table->boolean('justified')->default(false);
            $table->integer('duration_minutes')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('absences', function (Blueprint $table) {
            $table->dropColumn([
                'absence_date',
                'absence_type',
                'justified',
                'duration_minutes',
                'created_by',
            ]);
        });
    }
};
