import { Head, Link } from '@inertiajs/react';

import { PageHeading } from '@/components/cliptalk/page-heading';
import { Button } from '@/components/ui/button';
import { ClipFlowLayout } from '@/layouts/clip-flow-layout';
import { copy } from '@/lib/copy';
import { routes } from '@/lib/routes';

// Klip atau project yang tidak ada atau sudah kedaluwarsa (TASK 4.6). Di luar alur, jadi tanpa langkah aktif.
export default function NotFound() {
    return (
        <ClipFlowLayout width="upload">
            <Head title={copy.notFound.pageTitle} />
            <PageHeading title={copy.notFound.title} description={copy.notFound.description} />
            <Button asChild className="mt-8">
                <Link href={routes.upload()}>{copy.actions.createNew}</Link>
            </Button>
        </ClipFlowLayout>
    );
}
