import { Head } from '@inertiajs/react';
import { Check, CircleX, Download, Info, Play, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { AppHeader } from '@/components/cliptalk/app-header';
import { AvatarMenu } from '@/components/cliptalk/avatar-menu';
import { CandidateList } from '@/components/cliptalk/candidate-list';
import { ClipFrame } from '@/components/cliptalk/clip-frame';
import { Dropzone } from '@/components/cliptalk/dropzone';
import { FileRow } from '@/components/cliptalk/file-row';
import { JobProgress } from '@/components/cliptalk/job-progress';
import { RangeBar } from '@/components/cliptalk/range-bar';
import { SettingRow } from '@/components/cliptalk/setting-row';
import { SpecList } from '@/components/cliptalk/spec-list';
import type { Step } from '@/components/cliptalk/stepper';
import { TranscriptList } from '@/components/cliptalk/transcript-list';
import { VideoPlayer, type VideoPlayerHandle } from '@/components/cliptalk/video-player';
import { Wordmark } from '@/components/cliptalk/wordmark';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Toaster } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { copy } from '@/lib/copy';
import { formatDuration } from '@/lib/time';
import { cn } from '@/lib/utils';
import { candidates } from '@/mocks/candidates';
import { clip } from '@/mocks/clip';
import { project, projectStatus } from '@/mocks/project';
import { transcript } from '@/mocks/transcript';
import type { CaptionStyle, JobStageItem } from '@/types/cliptalk';

// Halaman uji khusus env local (TASK 1.4, 3.11), pengganti Storybook.
// Label section di sini untuk developer, jadi tidak masuk copy.ts.

const swatches = [
    { name: 'background', className: 'bg-background' },
    { name: 'card', className: 'bg-card' },
    { name: 'muted', className: 'bg-muted' },
    { name: 'accent', className: 'bg-accent' },
    { name: 'foreground', className: 'bg-foreground' },
    { name: 'muted-foreground', className: 'bg-muted-foreground' },
    { name: 'border', className: 'bg-border' },
    { name: 'input', className: 'bg-input' },
    { name: 'primary', className: 'bg-primary' },
    { name: 'range', className: 'bg-range' },
    { name: 'range-ink', className: 'bg-range-ink' },
    { name: 'range-soft', className: 'bg-range-soft' },
    { name: 'success', className: 'bg-success' },
    { name: 'success-soft', className: 'bg-success-soft' },
    { name: 'warning', className: 'bg-warning' },
    { name: 'warning-soft', className: 'bg-warning-soft' },
    { name: 'destructive', className: 'bg-destructive' },
    { name: 'destructive-soft', className: 'bg-destructive-soft' },
    { name: 'stage', className: 'bg-stage' },
    { name: 'caption-plate', className: 'bg-caption-plate' },
] as const;

const icon = { strokeWidth: 1.75 };

const failedStages: JobStageItem[] = [
    { key: 'uploaded', label: copy.processing.stages.uploaded, state: 'done', meta: '342 MB' },
    { key: 'transcribing', label: copy.processing.stages.transcribing, state: 'error' },
    { key: 'extracting', label: copy.processing.stages.extracting, state: 'pending' },
    { key: 'ready', label: copy.processing.stages.ready, state: 'pending' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="@container grid min-w-0 gap-3">
            <h3 className="text-[13px] leading-5 font-medium text-muted-foreground">{title}</h3>
            {children}
        </section>
    );
}

function Foundations() {
    return (
        <>
            <Section title="Warna">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {swatches.map((s) => (
                        <div key={s.name} className="flex min-w-0 items-center gap-2">
                            <span className={cn('size-6 shrink-0 rounded-sm border', s.className)} />
                            <span className="truncate font-mono text-xs tabular-nums">{s.name}</span>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Tipografi">
                <div className="grid gap-2">
                    <p className="text-4xl font-semibold tracking-tight">Display 36</p>
                    <p className="text-2xl font-semibold tracking-tight">Title 24</p>
                    <p className="text-base font-semibold tracking-[-0.01em]">Heading 16</p>
                    <p className="text-sm leading-[22px]">Body 14. Menurut saya, perkembangan teknologi mengubah cara kita bekerja.</p>
                    <p className="text-sm font-medium">Label 14/500</p>
                    <p className="text-[13px] leading-5 text-muted-foreground">Small 13, untuk deskripsi dan metadata.</p>
                    <p className="text-xs text-muted-foreground">Caption 12, nama pembicara</p>
                    <p className="font-mono text-[13px] font-medium tabular-nums">00:02:14 – 00:02:58</p>
                    <p className="font-mono text-xs whitespace-pre tabular-nums">{'1920×1080  H.264 + AAC'}</p>
                </div>
            </Section>
        </>
    );
}

function BaseComponents() {
    const [captions, setCaptions] = useState(true);
    const [duration, setDuration] = useState('60');
    const [title, setTitle] = useState(clip.title);

    return (
        <>
            <Section title="Button">
                <div className="flex flex-wrap items-center gap-2">
                    <Button>{copy.actions.createClip}</Button>
                    <Button variant="secondary">{copy.actions.chooseFile}</Button>
                    <Button variant="outline">
                        <Download {...icon} />
                        {copy.actions.downloadSrt}
                    </Button>
                    <Button variant="ghost">{copy.actions.back}</Button>
                    <Button variant="destructive">{copy.actions.remove}</Button>
                    <Button disabled>{copy.preview.rendering}</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline">
                        Ukuran sm
                    </Button>
                    <Button variant="outline">Ukuran default</Button>
                    <Button size="lg" variant="outline">
                        Ukuran lg
                    </Button>
                    <Button size="icon" variant="outline" aria-label={copy.player.play}>
                        <Play {...icon} />
                    </Button>
                </div>
            </Section>

            <Section title="Badge">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge>Netral</Badge>
                    <Badge tone="outline">Outline</Badge>
                    <Badge tone="range" mono>
                        {copy.segments.score(98)}
                    </Badge>
                    <Badge tone="success">
                        <Check {...icon} />
                        {copy.show.badge}
                    </Badge>
                    <Badge tone="warning">{copy.segments.lowConfidence}</Badge>
                    <Badge tone="destructive">{copy.processing.state.error}</Badge>
                    <Badge tone="outline" mono>
                        {copy.segments.score(85)}
                    </Badge>
                </div>
            </Section>

            <Section title="Card, Input, Switch, SegmentedControl">
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>Pengaturan klip</CardTitle>
                            <CardDescription>Perubahan langsung tampil di pratinjau.</CardDescription>
                        </div>
                        <Badge tone="outline" mono>
                            {formatDuration(44, true)}
                        </Badge>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="design-title">{copy.preview.titleLabel}</Label>
                            <span className="font-mono text-xs text-muted-foreground tabular-nums">{title.length}/60</span>
                        </div>
                        <Input id="design-title" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
                        <p className="text-[13px] leading-5 text-muted-foreground">{copy.preview.titleHint}</p>
                    </CardContent>
                    <div className="divide-y border-t">
                        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                            <Label htmlFor="design-captions">{copy.preview.captionsTitle}</Label>
                            <Switch id="design-captions" checked={captions} onCheckedChange={setCaptions} />
                        </div>
                        <SettingRow title={copy.upload.durationTitle} description={copy.upload.durationDescription}>
                            <ToggleGroup type="single" value={duration} onValueChange={(v) => v && setDuration(v)} aria-label={copy.upload.durationTitle}>
                                <ToggleGroupItem value="30">30 dtk</ToggleGroupItem>
                                <ToggleGroupItem value="60">60 dtk</ToggleGroupItem>
                                <ToggleGroupItem value="90">90 dtk</ToggleGroupItem>
                            </ToggleGroup>
                        </SettingRow>
                    </div>
                    <CardFooter>
                        <Button variant="ghost">{copy.actions.back}</Button>
                        <Button>{copy.actions.renderClip}</Button>
                    </CardFooter>
                </Card>
            </Section>

            <Section title="Notice">
                <Alert tone="info">
                    <Info {...icon} />
                    {copy.upload.footnote}
                </Alert>
                <Alert tone="warning">
                    <TriangleAlert {...icon} />
                    Audio di menit 11 kurang jelas. Transkrip bagian ini mungkin kurang akurat.
                </Alert>
                <Alert tone="error">
                    <CircleX {...icon} />
                    {copy.upload.errors.size}
                </Alert>
            </Section>

            <Section title="Progress, Tooltip, Toast">
                <Progress value={62} aria-label={copy.preview.rendering} />
                <div className="flex flex-wrap items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline">Arahkan ke sini</Button>
                        </TooltipTrigger>
                        <TooltipContent>{copy.segments.footnote}</TooltipContent>
                    </Tooltip>
                    <Button variant="outline" onClick={() => toast.success(copy.toast.clipCreated)}>
                        Tampilkan toast
                    </Button>
                </div>
            </Section>
        </>
    );
}

function FlowComponents() {
    const [step, setStep] = useState<Step>(2);
    const [file, setFile] = useState<{ name: string; size: number } | null>({ name: project.fileName, size: project.sizeBytes });
    const [error, setError] = useState<string | null>(null);

    return (
        <>
            <Section title="Wordmark, AppHeader, Stepper">
                <Wordmark />
                <div className="overflow-hidden rounded-lg border">
                    <AppHeader current={step} initials="NP" />
                </div>
                <ToggleGroup type="single" value={String(step)} onValueChange={(v) => v && setStep(Number(v) as Step)} aria-label="Langkah aktif" className="flex-wrap">
                    {[1, 2, 3, 4].map((n) => (
                        <ToggleGroupItem key={n} value={String(n)}>
                            Langkah {n}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </Section>

            <Section title="Dropzone, FileRow">
                <Dropzone
                    limits={{ maxBytes: 2 * 1024 ** 3, mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'] }}
                    onFile={(f) => {
                        setFile({ name: f.name, size: f.size });
                        setError(null);
                    }}
                    onError={setError}
                />
                {error && (
                    <Alert tone="error">
                        <CircleX {...icon} />
                        {error}
                    </Alert>
                )}
                {file && <FileRow name={file.name} sizeBytes={file.size} durationSec={project.durationSec} onRemove={() => setFile(null)} />}
                <FileRow
                    name="rekaman_podcast_bersama_narasumber_dengan_nama_file_yang_sangat_panjang.mov"
                    sizeBytes={1_288_490_188}
                    durationSec={4210}
                    status={<Badge tone="success">{copy.processing.state.done}</Badge>}
                />
            </Section>

            <Section title="SettingRow">
                <div className="divide-y rounded-lg border bg-card">
                    <SettingRow title={copy.upload.formatTitle}>
                        <span className="whitespace-pre">{copy.upload.formatValue}</span>
                    </SettingRow>
                    <SettingRow title={copy.upload.languageTitle}>{copy.upload.languageValue}</SettingRow>
                </div>
            </Section>

            <Section title="RangeBar">
                <RangeBar total={project.durationSec} start={134} end={178} playhead={150} ticks />
                <RangeBar total={project.durationSec} start={854} end={906} compact />
            </Section>

            <Section title="JobProgress">
                <Card>
                    <CardContent>
                        <JobProgress percent={projectStatus.percent} stages={projectStatus.stages} label={copy.processing.progressLabel} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="grid gap-4">
                        <JobProgress percent={35} stages={failedStages} label={copy.processing.progressLabel} />
                        <Alert tone="error">
                            <CircleX {...icon} />
                            {copy.processing.failed}
                        </Alert>
                    </CardContent>
                </Card>
            </Section>

            <Section title="SpecList">
                <SpecList
                    items={[
                        { label: copy.spec.fileName, value: 'cliptalk_bagaimana-teknologi-mengubah-cara-kerja.mp4', mono: true },
                        { label: copy.spec.duration, value: formatDuration(clip.end - clip.start) },
                        { label: copy.spec.ratio, value: copy.spec.ratioValue, mono: true },
                        { label: copy.spec.format, value: copy.spec.formatValue, mono: true },
                    ]}
                />
            </Section>
        </>
    );
}

function SegmentsDemo() {
    const playerRef = useRef<VideoPlayerHandle>(null);
    const [time, setTime] = useState(0);
    const [selectedId, setSelectedId] = useState(candidates[0].id);
    const selected = candidates.find((c) => c.id === selectedId) ?? null;
    const playingId = transcript.find((s) => time >= s.start && time < s.end)?.id ?? null;

    return (
        <Section title="VideoPlayer, SegmentCandidate, TranscriptLine (sinkron)">
            <div className="grid gap-6 @min-[900px]:grid-cols-12">
                <div className="grid content-start gap-6 @min-[900px]:col-span-7">
                    <VideoPlayer ref={playerRef} src={project.sourceUrl} duration={project.durationSec} range={selected} onTimeUpdate={setTime} />
                    <CandidateList
                        candidates={candidates}
                        total={project.durationSec}
                        selectedId={selectedId}
                        onSelect={(c) => {
                            setSelectedId(c.id);
                            playerRef.current?.seek(c.start);
                        }}
                    />
                </div>
                <TranscriptList
                    className="@min-[900px]:col-span-5"
                    segments={transcript}
                    total={project.durationSec}
                    playingId={playingId}
                    range={selected}
                    onSelect={(s) => playerRef.current?.seek(s.start)}
                />
            </div>
        </Section>
    );
}

function ClipFrameDemo() {
    const [time, setTime] = useState(clip.start);
    const [playing, setPlaying] = useState(false);
    const [style, setStyle] = useState<CaptionStyle>('outline');
    const words = useMemo(() => transcript.filter((s) => s.start >= clip.start && s.end <= clip.end).flatMap((s) => s.words), []);

    useEffect(() => {
        if (!playing) return;
        const id = window.setInterval(() => setTime((t) => (t + 0.1 >= clip.end ? clip.start : t + 0.1)), 100);
        return () => window.clearInterval(id);
    }, [playing]);

    return (
        <Section title="ClipFrame (subtitle mengikuti waktu)">
            <ToggleGroup type="single" value={style} onValueChange={(v) => v && setStyle(v as CaptionStyle)} aria-label={copy.preview.styleTitle}>
                <ToggleGroupItem value="outline">{copy.preview.styles.outline}</ToggleGroupItem>
                <ToggleGroupItem value="plate">{copy.preview.styles.plate}</ToggleGroupItem>
            </ToggleGroup>
            <div className="flex flex-wrap items-end gap-6">
                <ClipFrame
                    words={words}
                    start={clip.start}
                    end={clip.end}
                    time={time}
                    showCaptions
                    captionStyle={style}
                    playing={playing}
                    onPlayToggle={() => setPlaying((p) => !p)}
                />
                <ClipFrame words={words} start={clip.start} end={clip.end} time={clip.start + 1} showCaptions captionStyle="plate" className="max-w-[200px]" />
            </div>
        </Section>
    );
}

function Showcase() {
    return (
        <div className="grid gap-10">
            <Foundations />
            <BaseComponents />
            <FlowComponents />
            <SegmentsDemo />
            <ClipFrameDemo />
        </div>
    );
}

export default function Design() {
    const [narrow, setNarrow] = useState(false);
    // Mode 360px: tanpa padding panel supaya komponen diukur tepat 360px, seperti di layar ponsel.
    const panel = cn('mx-auto w-full rounded-lg border bg-background p-4 text-foreground sm:p-6', narrow && 'max-w-[360px] rounded-none border-0 p-0 sm:p-0');

    return (
        <TooltipProvider>
            <Head title="Design system" />
            <header className="flex h-14 items-center justify-between gap-4 border-b px-4">
                <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">ClipTalk /_design</span>
                <div className="flex items-center gap-3">
                    <ToggleGroup type="single" value={narrow ? '360' : 'full'} onValueChange={(v) => v && setNarrow(v === '360')} aria-label="Lebar panel">
                        <ToggleGroupItem value="full">Penuh</ToggleGroupItem>
                        <ToggleGroupItem value="360">360px</ToggleGroupItem>
                    </ToggleGroup>
                    <AvatarMenu initials="NP" />
                </div>
            </header>
            <main className="mx-auto grid w-full max-w-[1280px] gap-6 px-4 py-8">
                <div className={cn('light', panel)}>
                    <h2 className="mb-6 text-2xl font-semibold tracking-tight">Tema terang</h2>
                    <Showcase />
                </div>
                <div className={cn('dark', panel)}>
                    <h2 className="mb-6 text-2xl font-semibold tracking-tight">Tema gelap</h2>
                    <Showcase />
                </div>
            </main>
            <Toaster />
        </TooltipProvider>
    );
}
