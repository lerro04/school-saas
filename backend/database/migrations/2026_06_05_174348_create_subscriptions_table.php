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
    Schema::create('subscriptions', function (Blueprint $table) {
        $table->id();
        $table->string('tenant_id');
        $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        $table->enum('plan', ['trial', 'basic', 'premium'])->default('trial');
        $table->enum('status', ['active', 'expired', 'suspended'])->default('active');
        $table->timestamp('starts_at');
        $table->timestamp('expires_at');
        $table->integer('max_students')->default(100);
        $table->timestamps();
    });
}
};
