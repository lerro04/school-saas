<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->enum('transaction_type', ['income', 'expense']);
            $table->string('reference_number')->unique();
            $table->string('source_type');
            $table->unsignedBigInteger('source_id');
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method')->nullable();
            $table->string('transaction_reference')->nullable();
            $table->string('status')->default('recorded');
            $table->date('occurred_on');
            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['source_type', 'source_id']);
            $table->index(['transaction_type', 'occurred_on']);
            $table->index('status');
        });

        foreach (DB::table('revenues')->orderBy('id')->get() as $revenue) {
            DB::table('financial_transactions')->insert([
                'transaction_type' => 'income',
                'reference_number' => $revenue->reference_number,
                'source_type' => 'App\\Models\\Revenue',
                'source_id' => $revenue->id,
                'category' => $revenue->source,
                'description' => $revenue->description,
                'amount' => $revenue->amount,
                'payment_method' => $revenue->payment_method,
                'transaction_reference' => $revenue->transaction_reference,
                'status' => $revenue->status,
                'occurred_on' => $revenue->revenue_date,
                'recorded_by' => $revenue->received_by,
                'notes' => $revenue->notes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach (DB::table('expenses')->orderBy('id')->get() as $expense) {
            DB::table('financial_transactions')->insert([
                'transaction_type' => 'expense',
                'reference_number' => $expense->reference_number,
                'source_type' => 'App\\Models\\Expense',
                'source_id' => $expense->id,
                'category' => $expense->category,
                'description' => $expense->description,
                'amount' => $expense->amount,
                'payment_method' => $expense->payment_method,
                'transaction_reference' => $expense->receipt_number,
                'status' => $expense->status,
                'occurred_on' => $expense->expense_date,
                'recorded_by' => $expense->approved_by,
                'notes' => $expense->notes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
    }
};
