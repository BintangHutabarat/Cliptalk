<?php

namespace App\Enums;

/**
 * Tahap pemrosesan project; nilainya sama dengan ProjectStage di resources/js/types/cliptalk.ts.
 */
enum ProjectStage: string
{
    case Uploaded = 'uploaded';
    case Transcribing = 'transcribing';
    case Extracting = 'extracting';
    case Ready = 'ready';
    case Failed = 'failed';
}
