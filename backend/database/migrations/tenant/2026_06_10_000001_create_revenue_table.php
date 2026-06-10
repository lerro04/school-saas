<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revenues', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->enum('source', ['tuition', 'activity', 'exam', 'transport', 'uniform', 'lunch', 'donation', 'other'])->default('tuition');
            $table->decimal('amount', 12, 2);
            $table->unsignedBigInteger('student_id')->nullable();
            $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
            $table->string('description')->nullable();
            $table->enum('payment_method', ['cash', 'ecocash', 'zikit', 'bank_transfer', 'paynow'])->nullable();
            $table->string('transaction_reference')->nullable();
            $table->unsignedBigInteger('received_by'); // staff_id
            $table->enum('status', ['pending', 'confirmed', 'failed', 'reversed'])->default('confirmed');
            $table->date('revenue_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};
