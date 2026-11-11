
import { Head, router } from '@inertiajs/react';
import { CircleX, Info } from 'lucide-react';
import { useState } from 'react';

import { Dropzone } from '@/components/cliptalk/dropzone';
import { FileRow } from '@/components/cliptalk/file-row';
import { PageHeading } from '@/components/cliptalk/page-heading';
import { SettingRow } from '@/components/cliptalk/setting-row';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ClipFlowLayout } from '@/layouts/clip-flow-layout';
import { copy } from '@/lib/copy';
import { routes } from '@/lib/routes';
import type { ClipDuration } from '@/types/cliptalk';

type UploadProps = {
    limits: {
        maxBytes: number;
        mimeTypes: string[];
    };
    durations: ClipDuration[];
};

type SelectedFile = {
    file: File;
    durationSec: number | null;
};

const icon = { strokeWidth: 1.75 };

function readDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');

        const done = (value: number | null) => {
            URL.revokeObjectURL(url);
            resolve(value);
        };

        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            done(Number.isFinite(video.duration) ? video.duration : null);
        };
        video.onerror = () => done(null);
        video.src = url;
    });
}

export default function Upload({ limits, durations }: UploadProps) {
    const [selected, setSelected] = useState<SelectedFile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [targetDuration, setTargetDuration] = useState<ClipDuration>(
        durations.includes(60) ? 60 : durations[0],
    );
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const busy = submitting;

    const chooseFile = async (file: File) => {
        setError(null);
        setSelected({ file, durationSec: null });

        const durationSec = await readDuration(file);

        setSelected((current) =>
            current?.file === file ? { file, durationSec } : current,
        );
    };

    const startUpload = () => {
        if (!selected || busy) return;

        setError(null);
        setSubmitting(true);
        setUploadProgress(0);

        router.post(
            routes.projects.store(),
            {
                video: selected.file,
                targetDuration,
                durationSec: selected.durationSec ?? undefined,
            },
            {
                forceFormData: true,

                onProgress: (event) => {
                    if (event?.percentage != null) {
                        setUploadProgress(event.percentage);
                    }
                },

                onError: (errors) => {
                    const firstError = Object.values(errors)[0];

                    setError(
                        String(
                            firstError ??
                                'Upload gagal. Periksa file dan coba kembali.',
                        ),
                    );
                },

                onFinish: () => {
                    setSubmitting(false);
                    setUploadProgress(null);
                },
            },
        );
    };

    return (
        <ClipFlowLayout step={1} width="upload">
            <Head title={copy.upload.pageTitle} />

            <PageHeading
                title={copy.upload.title}
                description={copy.upload.description}
            />

            <div className="mt-8 grid gap-4">
                {selected ? (
                    <div className="grid gap-2">
                        <FileRow
                            name={selected.file.name}
                            sizeBytes={selected.file.size}
                            durationSec={selected.durationSec}
                            onRemove={
                                busy ? undefined : () => setSelected(null)
                            }
                        />

                        {busy && (
                            <div className="grid gap-1.5" aria-live="polite">
                                <div className="flex justify-between text-[13px] leading-5 text-muted-foreground">
                                    <span>{copy.upload.uploading}</span>
                                    <span className="font-mono text-xs tabular-nums">
                                        {Math.round(uploadProgress ?? 0)}%
                                    </span>
                                </div>

                                <Progress
                                    value={uploadProgress ?? 0}
                                    aria-label={copy.upload.uploadingLabel}
                                    className="h-1"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <Dropzone
                        limits={limits}
                        onFile={chooseFile}
                        onError={setError}
                    />
                )}

                {error && (
                    <Alert tone="error">
                        <CircleX {...icon} />
                        {error}
                    </Alert>
                )}

                <div className="divide-y rounded-lg border bg-card">
                    <SettingRow
                        title={copy.upload.durationTitle}
                        description={copy.upload.durationDescription}
                    >
                        <ToggleGroup
                            type="single"
                            value={String(targetDuration)}
                            onValueChange={(value) => {
                                if (value) {
                                    setTargetDuration(Number(value) as ClipDuration);
                                }
                            }}
                            aria-label={copy.upload.durationTitle}
                            disabled={busy}
                        >
                            {durations.map((duration) => (
                                <ToggleGroupItem
                                    key={duration}
                                    value={String(duration)}
                                >
                                    {copy.upload.durationOption(duration)}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </SettingRow>

                    <SettingRow title={copy.upload.formatTitle}>
                        <span className="whitespace-pre">
                            {copy.upload.formatValue}
                        </span>
                    </SettingRow>

                    <SettingRow title={copy.upload.languageTitle}>
                        {copy.upload.languageValue}
                    </SettingRow>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <p className="flex items-center gap-2 text-[13px] leading-5 text-muted-foreground">
                        <Info
                            className="size-4 shrink-0"
                            {...icon}
                            aria-hidden="true"
                        />
                        {copy.upload.footnote}
                    </p>

                    <Button
                        className="ml-auto"
                        disabled={!selected || busy}
                        onClick={startUpload}
                    >
                        {busy ? copy.upload.uploading : copy.actions.start}
                    </Button>
                </div>
            </div>
        </ClipFlowLayout>
    );
}
