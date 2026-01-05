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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->default('autre');
            $table->string('status')->default('neuf');
            $table->date('acquisition_date')->nullable();
            $table->decimal('acquisition_value', 10, 2)->default(0);
            $table->decimal('current_value', 10, 2)->default(0);
            $table->string('location')->nullable();
            $table->string('serial_number')->nullable();
            $table->string('supplier')->nullable();
            $table->date('warranty_end_date')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
