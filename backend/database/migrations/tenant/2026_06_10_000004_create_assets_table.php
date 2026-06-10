<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_code')->unique();
            $table->string('name');
            $table->string('category'); // furniture, equipment, electronics, vehicles, etc
            $table->string('description')->nullable();
            $table->decimal('purchase_price', 12, 2);
            $table->decimal('current_value', 12, 2);
            $table->date('purchase_date');
            $table->string('location')->nullable(); // classroom, office, etc
            $table->string('condition')->default('good'); // excellent, good, fair, poor
            $table->enum('status', ['active', 'inactive', 'disposed', 'lost'])->default('active');
            $table->string('supplier_name')->nullable();
            $table->string('warranty_info')->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};
