import { Head } from '@inertiajs/react';

import { copy } from '@/lib/copy';

// Kerangka langkah 1. Isi lengkap (Dropzone, FileRow, SettingRow) dikerjakan di TASK 4.1.
export default function Upload() {
    return (
        <>
            <Head title={copy.upload.pageTitle} />
            <main className="mx-auto w-full max-w-[640px] px-4 py-12">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{copy.upload.title}</h1>
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{copy.upload.description}</p>
            </main>
        </>
    );
}
