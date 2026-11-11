<?php

namespace App\Jobs;

use App\Enums\ClipStage;
use App\Models\Clip;
use App\Services\ClipRenderService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class RenderClip implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 660;

    public function __construct(
        public string $clipId
    ) {}

    public function handle(ClipRenderService $renderService): void
    {
        $clip = Clip::findOrFail($this->clipId);

        $clip->update([
            'stage' => ClipStage::Rendering,
            'progress' => 0,
            'error' => null,
        ]);

        $result = $renderService->render(
            $clip,
            fn (int $percent) => $clip->update(['progress' => $percent])
        );

        $clip->update([
            ...$result,
            'stage' => ClipStage::Ready,
            'progress' => 100,
            'error' => null,
        ]);
    }

    public function failed(Throwable $exception): void
    {
        report($exception);

        // Detail teknis masuk log; pengguna hanya melihat cara memperbaikinya (RULE.md §4).
        Clip::whereKey($this->clipId)->update([
            'stage' => ClipStage::Failed,
            'progress' => 0,
            'error' => 'Render klip gagal. Coba render lagi. Jika masih gagal, unggah ulang videonya.',
        ]);
    }
}
