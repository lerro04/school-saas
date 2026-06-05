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
    Schema::create('staff', function (Blueprint $table) {
        $table->id();
        $table->string('staff_number')->unique();
        $table->string('first_name');
        $table->string('last_name');
        $table->string('email')->unique();
        $table->string('phone');
        $table->enum('role', ['teacher', 'bursar', 'admin', 'headmaster', 'support']);
        $table->string('subject')->nullable(); // for teachers
        $table->date('hire_date');
        $table->decimal('basic_salary', 10, 2)->default(0);
        $table->enum('status', ['active', 'on_leave', 'terminated'])->default('active');
        $table->unsignedBigInteger('user_id')->nullable(); // links to users table
        $table->timestamps();
        $table->softDeletes();
    });
}
};
