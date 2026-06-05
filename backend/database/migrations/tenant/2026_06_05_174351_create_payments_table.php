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
    Schema::create('payments', function (Blueprint $table) {
        $table->id();
        $table->string('receipt_number')->unique();
        $table->unsignedBigInteger('invoice_id');
        $table->foreign('invoice_id')->references('id')->on('fee_invoices')->onDelete('cascade');
        $table->unsignedBigInteger('student_id');
        $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
        $table->decimal('amount', 10, 2);
        $table->enum('method', ['cash', 'ecocash', 'zipit', 'bank_transfer', 'paynow']);
        $table->string('transaction_reference')->nullable();
        $table->enum('status', ['pending', 'confirmed', 'failed', 'reversed'])->default('confirmed');
        $table->unsignedBigInteger('received_by'); // staff_id
        $table->text('notes')->nullable();
        $table->timestamp('paid_at');
        $table->timestamps();
    });
}
};
