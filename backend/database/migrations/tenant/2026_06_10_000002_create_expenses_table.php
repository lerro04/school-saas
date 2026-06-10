<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->enum('category', ['salaries', 'utilities', 'maintenance', 'supplies', 'transport', 'food', 'equipment', 'rent', 'software', 'other'])->default('other');
            $table->decimal('amount', 12, 2);
            $table->string('vendor_name')->nullable();
            $table->string('description');
            $table->date('expense_date');
            $table->enum('payment_method', ['cash', 'cheque', 'bank_transfer', 'ecocash', 'paynow'])->default('bank_transfer');
            $table->string('receipt_number')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable(); // staff_id
            $table->enum('status', ['pending', 'approved', 'paid', 'rejected'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};
