<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('item_code')->unique();
            $table->string('name');
            $table->string('category'); // stationery, cleaning, laboratory, maintenance, etc
            $table->string('unit'); // pieces, reams, boxes, liters, etc
            $table->integer('quantity_in_stock')->default(0);
            $table->integer('reorder_level')->default(10);
            $table->decimal('unit_cost', 10, 2);
            $table->string('supplier_name')->nullable();
            $table->string('supplier_contact')->nullable();
            $table->string('location')->nullable(); // storage location
            $table->date('last_restocked_date')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'discontinued'])->default('active');
            $table->timestamps();
        });

        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('item_id');
            $table->foreign('item_id')->references('id')->on('inventory_items')->onDelete('cascade');
            $table->enum('type', ['in', 'out']); // in = restocking, out = usage
            $table->integer('quantity');
            $table->string('reference')->nullable(); // PO number, requisition ID, etc
            $table->unsignedBigInteger('recorded_by');
            $table->foreign('recorded_by')->references('id')->on('staff')->onDelete('cascade');
            $table->text('notes')->nullable();
            $table->timestamp('transaction_date');
            $table->timestamps();
        });
    }
};
