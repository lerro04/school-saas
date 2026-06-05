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
    Schema::create('students', function (Blueprint $table) {
        $table->id();
        $table->string('student_number')->unique();
        $table->string('first_name');
        $table->string('last_name');
        $table->date('date_of_birth');
        $table->enum('gender', ['male', 'female']);
        $table->string('national_id')->nullable();
        $table->unsignedBigInteger('class_id')->nullable();
        $table->foreign('class_id')->references('id')->on('classes')->nullOnDelete();
        $table->string('parent_name');
        $table->string('parent_phone');
        $table->string('parent_email')->nullable();
        $table->string('address')->nullable();
        $table->enum('status', ['active', 'transferred', 'graduated', 'suspended'])->default('active');
        $table->date('enrollment_date');
        $table->timestamps();
        $table->softDeletes();
    });
}
};
