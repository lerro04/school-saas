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
    Schema::create('payroll', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('staff_id');
        $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
        $table->string('month'); // e.g. "June 2026"
        $table->decimal('basic_salary', 10, 2);
        $table->decimal('allowances', 10, 2)->default(0);
        $table->decimal('deductions', 10, 2)->default(0);
        $table->decimal('net_salary', 10, 2);
        $table->enum('status', ['pending', 'paid'])->default('pending');
        $table->date('payment_date')->nullable();
        $table->string('payment_reference')->nullable();
        $table->timestamps();
    });
}
};
