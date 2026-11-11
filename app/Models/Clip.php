<?php

namespace App\Models;

use App\Enums\CaptionStyle;
use App\Enums\ClipStage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Clip extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'project_id',
        'candidate_id',
        'title',
        'start_sec',
        'end_sec',
        'show_captions',
        'caption_style',
        'stage',
        'progress',
        'error',
        'output_path',
        'subtitle_path',
        'output_size_bytes',
        'sha256',
    ];

    protected function casts(): array
    {
        return [
            'start_sec' => 'float',
            'end_sec' => 'float',
            'show_captions' => 'boolean',
            'caption_style' => CaptionStyle::class,
            'stage' => ClipStage::class,
            'progress' => 'integer',
            'output_size_bytes' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Clip $clip) {
            if (empty($clip->id)) {
                $clip->id = (string) Str::uuid();
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
