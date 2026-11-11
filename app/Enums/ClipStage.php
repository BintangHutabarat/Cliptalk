<?php

namespace App\Enums;

/**
 * Tahap render klip; nilainya sama dengan ClipStage di resources/js/types/cliptalk.ts.
 */
enum ClipStage: string
{
    case Draft = 'draft';
    case Queued = 'queued';
    case Rendering = 'rendering';
    case Ready = 'ready';
    case Failed = 'failed';

    public function isBusy(): bool
    {
        return $this === self::Queued || $this === self::Rendering;
    }
}
