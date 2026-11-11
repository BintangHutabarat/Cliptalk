<?php

namespace App\Models;

use App\Enums\ProjectStage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Project extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'file_name',
        'file_path',
        'mime_type',
        'size_bytes',
        'target_duration',
        'duration_sec',
        'width',
        'height',
        'fps',
        'stage',
        'error',
        'transcript_path',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'target_duration' => 'integer',
            'duration_sec' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'fps' => 'float',
            'stage' => ProjectStage::class,
        ];
    }

    public function clips(): HasMany
    {
        return $this->hasMany(Clip::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (empty($project->id)) {
                $project->id = (string) Str::uuid();
            }
        });
    }
}
