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
    Schema::create('fee_invoices', function (Blueprint $table) {
        $table->id();
        $table->string('invoice_number')->unique();
        $table->unsignedBigInteger('student_id');
        $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
        $table->string('term'); // e.g. "Term 1 2026"
        $table->decimal('tuition_fee', 10, 2)->default(0);
        $table->decimal('boarding_fee', 10, 2)->default(0);
        $table->decimal('activity_fee', 10, 2)->default(0);
        $table->decimal('total_amount', 10, 2);
        $table->decimal('amount_paid', 10, 2)->default(0);
        $table->decimal('balance', 10, 2);
        $table->enum('status', ['unpaid', 'partial', 'paid'])->default('unpaid');
        $table->date('due_date');
        $table->timestamps();
    });
}
};
