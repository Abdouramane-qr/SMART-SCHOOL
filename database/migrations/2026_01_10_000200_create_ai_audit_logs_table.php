<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role', 32)->nullable();
            $table->string('agent_key', 32)->nullable();
            $table->string('status', 32)->default('ok');
            $table->text('question')->nullable();
            $table->json('queries')->nullable();
            $table->unsignedInteger('documents_count')->default(0);
            $table->boolean('flagged')->default(false);
            $table->string('flag_reason')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'role', 'created_at']);
            $table->index(['school_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_audit_logs');
    }
};
