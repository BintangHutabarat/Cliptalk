import { Head } from '@inertiajs/react';

import { ClipFlowLayout } from '@/layouts/clip-flow-layout';
import { copy } from '@/lib/copy';

// Kerangka langkah 1. Isi lengkap (Dropzone, FileRow, SettingRow) dikerjakan di TASK 4.1.
export default function Upload() {
    return (
        <ClipFlowLayout step={1} width="upload">
            <Head title={copy.upload.pageTitle} />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{copy.upload.title}</h1>
            <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{copy.upload.description}</p>
        </ClipFlowLayout>
    );
}
