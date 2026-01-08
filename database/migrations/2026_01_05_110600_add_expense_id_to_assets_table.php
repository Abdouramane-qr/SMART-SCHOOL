<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->foreignId('expense_id')
                ->nullable()
                ->after('school_id')
                ->constrained('expenses')
                ->nullOnDelete();
        });

        DB::table('assets')
            ->whereIn('status', ['neuf', 'bon', 'usage'])
            ->update(['status' => 'actif']);

        DB::table('assets')
            ->whereIn('status', ['maintenance', 'hors_service', 'endommage'])
            ->update(['status' => 'panne']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['expense_id']);
            $table->dropColumn('expense_id');
        });
    }
};
