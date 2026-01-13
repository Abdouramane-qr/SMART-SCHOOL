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
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role')->nullable();
            $table->string('entity')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip', 45)->nullable();

            $table->index(['action', 'entity']);
            $table->index(['user_id', 'school_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['action', 'entity']);
            $table->dropIndex(['user_id', 'school_id']);
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['role', 'entity', 'metadata', 'ip']);
        });
    }
};
