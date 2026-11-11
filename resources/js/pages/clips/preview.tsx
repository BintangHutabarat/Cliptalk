import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ClipFrame } from '@/components/cliptalk/clip-frame';
import { PageHeading } from '@/components/cliptalk/page-heading';
import { SettingRow } from '@/components/cliptalk/setting-row';
import { SpecList } from '@/components/cliptalk/spec-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSimulatedProgress } from '@/hooks/use-simulated-progress';
import { ClipFlowLayout } from '@/layouts/clip-flow-layout';
import { copy } from '@/lib/copy';
import { routes } from '@/lib/routes';
import { formatDuration } from '@/lib/time';
import type { CaptionStyle, Clip, Project, TranscriptSegment } from '@/types/cliptalk';

type PreviewProps = {
    project: Project;
    clip: Clip;
    /** Hanya segmen di dalam rentang klip. */
    transcript: TranscriptSegment[];
};

const TITLE_MAX = 60;
const RENDER_SIMULATION_MS = 2500;


export default function Preview({ project, clip, transcript }: PreviewProps) {
    const form = useForm({
        title: clip.title,
        showCaptions: clip.showCaptions,
        captionStyle: clip.captionStyle,
    });
    const [clientError, setClientError] = useState<string | null>(null);
    const titleError = clientError ?? form.errors.title;

    const videoRef = useRef<HTMLVideoElement>(null);
    const [time, setTime] = useState(clip.start);
    const [playing, setPlaying] = useState(false);

    const words = useMemo(
        () =>
            transcript.flatMap((segment) => {
                // Waktu kata asli dari Faster-Whisper; perkiraan rata hanya untuk transkrip lama tanpa words.
                if (segment.words.length > 0) return segment.words;

                const tokens = segment.text.trim().split(/\s+/).filter(Boolean);
                if (tokens.length === 0) return [];

                const duration = segment.end - segment.start;

                return tokens.map((text, index) => ({
                    text,
                    start: segment.start + (duration * index) / tokens.length,
                    end: segment.start + (duration * (index + 1)) / tokens.length,
                    probability: 1,
                }));
            }),
        [transcript],
    );

    // Klip berganti: reset waktu saat render (bukan di effect) supaya tidak ada render berantai.
    const clipKey = `${clip.id}:${clip.start}`;
    const [syncedClipKey, setSyncedClipKey] = useState(clipKey);
    if (syncedClipKey !== clipKey) {
        setSyncedClipKey(clipKey);
        setTime(clip.start);
        setPlaying(false);
    }

    useEffect(() => {
        const video = videoRef.current;

        if (video && video.readyState >= 1) {
            video.currentTime = clip.start;
        }
    }, [clip.start, clip.id]);

    const togglePlayback = () => {
        const video = videoRef.current;
        if (!video) return;

        if (!video.paused) {
            video.pause();
            return;
        }

        if (video.currentTime >= clip.end - 0.05) {
            video.currentTime = clip.start;
        }

        void video.play().catch(() => {
            setPlaying(false);
        });
    };

    const handleTimeUpdate = (
        event: React.SyntheticEvent<HTMLVideoElement>,
    ) => {
        const video = event.currentTarget;

        if (video.currentTime >= clip.end) {
            video.pause();
            video.currentTime = clip.end;
        }

        setTime(Math.min(video.currentTime, clip.end));
    };

    const render = useSimulatedProgress(RENDER_SIMULATION_MS, (reset) => {
        form.post(routes.clips.render(clip.id), { onFinish: reset });
    });
    const busy = render.running || form.processing;

    const startRender = () => {
        if (!form.data.title.trim()) {
            setClientError(copy.preview.titleRequired);
            return;
        }
        setPlaying(false);
        render.start();
    };

    return (
        <ClipFlowLayout step={3} width="preview">
            <Head title={copy.preview.pageTitle} />
            <PageHeading title={copy.preview.title} />

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
                <ClipFrame
                    className="w-full shrink-0 sm:w-[480px]"
                    words={words}
                    start={clip.start}
                    end={clip.end}
                    time={time}
                    showCaptions={form.data.showCaptions}
                    captionStyle={form.data.captionStyle}
                    playing={playing}
                    onPlayToggle={togglePlayback}
                >
                    <video
                        ref={videoRef}
                        src={project.sourceUrl}
                        preload="metadata"
                        playsInline
                        onLoadedMetadata={(event) => {
                            event.currentTarget.currentTime = clip.start;
                        }}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        onEnded={() => setPlaying(false)}
                    />
                </ClipFrame>

                <div className="grid min-w-0 flex-1 gap-6 sm:max-w-[360px]">
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="clip-title">{copy.preview.titleLabel}</Label>
                            <span className="font-mono text-xs text-muted-foreground tabular-nums" aria-live="polite">
                                {form.data.title.length}/{TITLE_MAX}
                            </span>
                        </div>
                        <Input
                            id="clip-title"
                            value={form.data.title}
                            maxLength={TITLE_MAX}
                            disabled={busy}
                            aria-invalid={!!titleError}
                            aria-describedby="clip-title-hint"
                            onChange={(e) => {
                                form.setData('title', e.target.value);
                                setClientError(null);
                                form.clearErrors('title');
                            }}
                        />
                        <p id="clip-title-hint" className={titleError ? 'text-[13px] leading-5 text-destructive' : 'text-[13px] leading-5 text-muted-foreground'}>
                            {titleError ?? copy.preview.titleHint}
                        </p>
                    </div>

                    <div className="divide-y rounded-lg border bg-card">
                        <SettingRow title={copy.preview.captionsTitle} description={copy.preview.captionsDescription}>
                            <Switch
                                aria-label={copy.preview.captionsTitle}
                                checked={form.data.showCaptions}
                                disabled={busy}
                                onCheckedChange={(checked) => form.setData('showCaptions', checked)}
                            />
                        </SettingRow>
                        <SettingRow title={copy.preview.styleTitle}>
                            <ToggleGroup
                                type="single"
                                value={form.data.captionStyle}
                                disabled={busy || !form.data.showCaptions}
                                onValueChange={(value) => value && form.setData('captionStyle', value as CaptionStyle)}
                                aria-label={copy.preview.styleTitle}
                            >
                                <ToggleGroupItem value="outline">{copy.preview.styles.outline}</ToggleGroupItem>
                                <ToggleGroupItem value="plate">{copy.preview.styles.plate}</ToggleGroupItem>
                            </ToggleGroup>
                        </SettingRow>
                    </div>

                    <SpecList
                        items={[
                            { label: copy.spec.duration, value: formatDuration(clip.end - clip.start) },
                            { label: copy.spec.ratio, value: copy.spec.ratioValue, mono: true },
                            { label: copy.spec.format, value: copy.spec.formatValue, mono: true },
                        ]}
                    />

                    {render.running && (
                        <div className="grid gap-1.5" aria-live="polite">
                            <div className="flex justify-between text-[13px] leading-5 text-muted-foreground">
                                <span>{copy.preview.rendering}</span>
                                <span className="font-mono text-xs tabular-nums">{Math.round(render.progress ?? 0)}%</span>
                            </div>
                            <Progress value={render.progress ?? 0} aria-label={copy.preview.renderingLabel} className="h-1" />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-between gap-2">
                <Button variant="ghost" asChild>
                    <Link href={routes.projects.segments(project.id)}>{copy.actions.back}</Link>
                </Button>
                <Button disabled={busy} onClick={startRender}>
                    {busy ? copy.preview.rendering : copy.actions.renderClip}
                </Button>
            </div>
        </ClipFlowLayout>
    );
}
