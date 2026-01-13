<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_audit_logs', function (Blueprint $table) {
            $table->string('correlation_id', 64)->nullable()->after('agent_key');
            $table->json('document_ids')->nullable()->after('queries');
            $table->index(['correlation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('ai_audit_logs', function (Blueprint $table) {
            $table->dropIndex(['correlation_id', 'created_at']);
            $table->dropColumn(['correlation_id', 'document_ids']);
        });
    }
};
