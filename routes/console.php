<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Hapus file dan data yang lewat 24 jam (SYSTEM-DESIGN.md §6, TASK 6.9).
Schedule::command('cliptalk:purge-expired')->hourly()->withoutOverlapping();
