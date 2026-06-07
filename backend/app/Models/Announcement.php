<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title', 'body', 'audience', 'posted_by', 'is_published', 'published_at',
    ];

    protected $casts = ['is_published' => 'boolean', 'published_at' => 'datetime'];
}