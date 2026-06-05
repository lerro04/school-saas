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
    Schema::create('classes', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // e.g. "Form 1A"
        $table->string('level'); // e.g. "Form 1"
        $table->string('stream')->nullable(); // e.g. "A", "B"
        $table->unsignedBigInteger('teacher_id')->nullable();
        $table->integer('capacity')->default(40);
        $table->string('academic_year'); // e.g. "2026"
        $table->timestamps();
    });
}
};
