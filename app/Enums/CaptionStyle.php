<?php

namespace App\Enums;

/**
 * Gaya subtitle yang dibakar ke video (SYSTEM-DESIGN.md §6).
 */
enum CaptionStyle: string
{
    case Outline = 'outline';
    case Plate = 'plate';
}
