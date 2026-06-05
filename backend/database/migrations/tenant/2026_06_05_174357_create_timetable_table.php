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
    Schema::create('timetable', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('class_id');
        $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
        $table->unsignedBigInteger('teacher_id');
        $table->string('subject');
        $table->enum('day', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
        $table->time('start_time');
        $table->time('end_time');
        $table->string('room')->nullable();
        $table->timestamps();
    });
}
};
