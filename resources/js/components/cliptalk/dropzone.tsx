import { Upload } from 'lucide-react';
import { useId, useRef, useState, type DragEvent } from 'react';

import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import { validateVideoFile, type VideoLimits } from '@/lib/validate-video';

type DropzoneProps = {
    limits: VideoLimits;
    onFile: (file: File) => void;
    /** Dipanggil dengan pesan error siap tampil; halaman menampilkannya sebagai Notice. */
    onError: (message: string) => void;
    disabled?: boolean;
    className?: string;
};

export function Dropzone({ limits, onFile, onError, disabled = false, className }: DropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    // dragenter/dragleave juga terpicu di elemen anak, jadi dihitung supaya state tidak berkedip.
    const depth = useRef(0);
    const [over, setOver] = useState(false);
    const hintId = useId();

    const accept = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (files.length > 1) return onError(copy.upload.errors.multiple);
        const error = validateVideoFile(files[0], limits);
        if (error) return onError(copy.upload.errors[error]);
        onFile(files[0]);
    };

    const onDrag = (event: DragEvent, delta: 1 | -1 | 0) => {
        event.preventDefault();
        if (disabled) return;
        depth.current = Math.max(0, depth.current + delta);
        setOver(depth.current > 0);
    };

    return (
        <div
            onDragEnter={(e) => onDrag(e, 1)}
            onDragLeave={(e) => onDrag(e, -1)}
            onDragOver={(e) => onDrag(e, 0)}
            onDrop={(e) => {
                onDrag(e, 0);
                depth.current = 0;
                setOver(false);
                if (!disabled) accept(e.dataTransfer.files);
            }}
            className={cn(
                'grid justify-items-center gap-3 rounded-lg border border-dashed border-input bg-card px-6 py-12 text-center transition-colors duration-150',
                over && 'border-solid border-foreground bg-accent',
                disabled && 'opacity-50',
                className,
            )}
        >
            <Upload className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <p className="font-medium" aria-live="polite">
                {over ? copy.upload.dropActive : copy.upload.dropTitle}
            </p>
            <Button type="button" variant="secondary" disabled={disabled} aria-describedby={hintId} onClick={() => inputRef.current?.click()}>
                {copy.actions.chooseFile}
            </Button>
            <p id={hintId} className="text-[13px] leading-5 text-muted-foreground">
                {copy.upload.dropHint}
            </p>
            <input
                ref={inputRef}
                type="file"
                accept={limits.mimeTypes.join(',')}
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                onChange={(e) => {
                    accept(e.target.files);
                    e.target.value = ''; // supaya file yang sama bisa dipilih lagi
                }}
            />
        </div>
    );
}
