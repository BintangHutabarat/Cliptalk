import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';

import { RangeBar } from '@/components/cliptalk/range-bar';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { formatTimecode } from '@/lib/time';
import { cn } from '@/lib/utils';

export type VideoPlayerHandle = {
    seek: (sec: number) => void;
    play: () => void;
    pause: () => void;
};

type VideoPlayerProps = {
    src: string;
    /** Durasi sumber (detik) dari Project.durationSec. */
    duration: number;
    /** Rentang klip yang ditandai di RangeBar. */
    range?: { start: number; end: number } | null;
    onTimeUpdate?: (sec: number) => void;
    ref?: Ref<VideoPlayerHandle>;
    className?: string;
};

const SPEEDS = [1, 1.25, 1.5, 2] as const;
const SKIP_SEC = 5;
const formatSpeed = (speed: number) => `${speed % 1 ? speed : speed.toFixed(1)}×`;

export function VideoPlayer({ src, duration, range, onTimeUpdate, ref, className }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const timeRef = useRef(0);
    const onTimeRef = useRef(onTimeUpdate);
    const [time, setTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState<number>(1);
    // shortcut: video contoh tidak di-commit (SYSTEM-DESIGN.md §8); tanpa file, waktu disimulasikan agar sinkron transkrip tetap bisa dicoba.
    const [missing, setMissing] = useState(false);

    useEffect(() => {
        onTimeRef.current = onTimeUpdate;
    });

    const update = useCallback(
        (sec: number) => {
            const t = Math.min(Math.max(sec, 0), duration);
            timeRef.current = t;
            setTime(t);
            onTimeRef.current?.(t);
        },
        [duration],
    );

    const seek = useCallback(
        (sec: number) => {
            const video = videoRef.current;
            if (video && !missing) video.currentTime = Math.min(Math.max(sec, 0), duration);
            update(sec);
        },
        [duration, missing, update],
    );

    const play = useCallback(() => {
        if (missing) setPlaying(true);
        else videoRef.current?.play().catch(() => setPlaying(false));
    }, [missing]);

    const pause = useCallback(() => {
        if (missing) setPlaying(false);
        else videoRef.current?.pause();
    }, [missing]);

    useImperativeHandle(ref, () => ({ seek, play, pause }), [seek, play, pause]);

    useEffect(() => {
        if (videoRef.current) videoRef.current.playbackRate = speed;
    }, [speed]);

    useEffect(() => {
        if (!missing || !playing) return;
        let last = performance.now();
        const id = window.setInterval(() => {
            const now = performance.now();
            const next = timeRef.current + ((now - last) / 1000) * speed;
            last = now;
            update(next);
            if (next >= duration) setPlaying(false);
        }, 250);
        return () => window.clearInterval(id);
    }, [missing, playing, speed, duration, update]);

    return (
        <div className={cn('overflow-hidden rounded-lg border bg-card', className)}>
            <div className="relative aspect-video bg-stage">
                {missing ? (
                    <p className="absolute inset-0 grid place-items-center px-4 text-center text-[13px] text-stage-muted">{copy.player.noVideo}</p>
                ) : (
                    <video
                        ref={videoRef}
                        src={src}
                        preload="metadata"
                        playsInline
                        className="size-full object-cover"
                        onTimeUpdate={(e) => update(e.currentTarget.currentTime)}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        onEnded={() => setPlaying(false)}
                        onError={() => {
                            setMissing(true);
                            setPlaying(false);
                        }}
                    />
                )}
            </div>
            <div className="grid gap-2 px-3 pt-2 pb-3 sm:px-4">
                <div className="flex flex-wrap items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label={playing ? copy.player.pause : copy.player.play} onClick={playing ? pause : play}>
                        {playing ? <Pause strokeWidth={1.75} /> : <Play strokeWidth={1.75} />}
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={copy.player.back5} onClick={() => seek(timeRef.current - SKIP_SEC)}>
                        <RotateCcw strokeWidth={1.75} />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={copy.player.forward5} onClick={() => seek(timeRef.current + SKIP_SEC)}>
                        <RotateCw strokeWidth={1.75} />
                    </Button>
                    <span className="ml-1 font-mono text-xs font-medium tabular-nums sm:text-[13px]">
                        {formatTimecode(time)} / {formatTimecode(duration)}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto font-mono tabular-nums"
                        aria-label={`${copy.player.speed} ${formatSpeed(speed)}`}
                        onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length])}
                    >
                        {formatSpeed(speed)}
                    </Button>
                </div>
                <RangeBar total={duration} start={range?.start} end={range?.end} playhead={time} ticks onSeek={seek} />
            </div>
        </div>
    );
}
