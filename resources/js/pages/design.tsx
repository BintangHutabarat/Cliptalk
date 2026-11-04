import { Head } from '@inertiajs/react';
import { Check, Download, Info, Play, TriangleAlert, CircleX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AvatarMenu } from '@/components/cliptalk/avatar-menu';
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
import { cn } from '@/lib/utils';

// Halaman uji khusus env local (TASK 1.4, 3.11). Bukan bagian alur pengguna, jadi teksnya tidak masuk copy.ts.

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <h3 className="text-[13px] leading-5 font-medium text-muted-foreground">{title}</h3>
            {children}
        </section>
    );
}

function Showcase() {
    const [captions, setCaptions] = useState(true);
    const [duration, setDuration] = useState('60');
    const [title, setTitle] = useState('Bagaimana teknologi mengubah cara kerja');

    return (
        <div className="space-y-8">
            <Section title="Warna">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {swatches.map((s) => (
                        <div key={s.name} className="flex items-center gap-2">
                            <span className={cn('size-6 shrink-0 rounded-sm border', s.className)} />
                            <span className="truncate font-mono text-xs tabular-nums">{s.name}</span>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Tipografi">
                <div className="space-y-2">
                    <p className="text-4xl font-semibold tracking-tight">Display 36</p>
                    <p className="text-2xl font-semibold tracking-tight">Title 24</p>
                    <p className="text-base font-semibold tracking-[-0.01em]">Heading 16</p>
                    <p className="text-sm leading-[22px]">Body 14. Menurut saya, perkembangan teknologi mengubah cara kita bekerja.</p>
                    <p className="text-sm font-medium">Label 14/500</p>
                    <p className="text-[13px] leading-5 text-muted-foreground">Small 13, untuk deskripsi dan metadata.</p>
                    <p className="text-xs text-muted-foreground">Caption 12, nama pembicara</p>
                    <p className="font-mono text-[13px] font-medium tabular-nums">00:02:14 – 00:02:58</p>
                    <p className="font-mono text-xs tabular-nums">1080×1920  H.264 + AAC</p>
                </div>
            </Section>

            <Section title="Button">
                <div className="flex flex-wrap items-center gap-2">
                    <Button>Buat klip</Button>
                    <Button variant="secondary">Pilih dari komputer</Button>
                    <Button variant="outline">
                        <Download {...icon} />
                        Unduh SRT
                    </Button>
                    <Button variant="ghost">Kembali</Button>
                    <Button variant="destructive">Hapus</Button>
                    <Button disabled>Memproses…</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline">
                        Ukuran sm
                    </Button>
                    <Button variant="outline">Ukuran default</Button>
                    <Button size="lg" variant="outline">
                        Ukuran lg
                    </Button>
                    <Button size="icon" variant="outline" aria-label="Putar">
                        <Play {...icon} />
                    </Button>
                </div>
            </Section>

            <Section title="Badge">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge>Netral</Badge>
                    <Badge tone="outline">Outline</Badge>
                    <Badge tone="range" mono>
                        Skor 98
                    </Badge>
                    <Badge tone="success">
                        <Check {...icon} />
                        Klip siap
                    </Badge>
                    <Badge tone="warning">Kurang yakin</Badge>
                    <Badge tone="destructive">Gagal</Badge>
                    <Badge mono>Skor 85</Badge>
                    <Badge tone="outline" mono>
                        1080×1920
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
                            44 dtk
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="design-title">Judul klip</Label>
                            <span className="font-mono text-xs text-muted-foreground tabular-nums">{title.length}/60</span>
                        </div>
                        <Input id="design-title" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
                        <p className="text-[13px] leading-5 text-muted-foreground">Dipakai sebagai nama file dan judul metadata.</p>
                    </CardContent>
                    <div className="divide-y border-t">
                        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                            <Label htmlFor="design-captions">Tampilkan subtitle</Label>
                            <Switch id="design-captions" checked={captions} onCheckedChange={setCaptions} />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
                            <div>
                                <p className="text-sm font-medium">Durasi klip</p>
                                <p className="text-[13px] leading-5 text-muted-foreground">Target panjang tiap klip.</p>
                            </div>
                            <ToggleGroup
                                type="single"
                                value={duration}
                                onValueChange={(v) => v && setDuration(v)}
                                aria-label="Durasi klip"
                            >
                                <ToggleGroupItem value="30">30 dtk</ToggleGroupItem>
                                <ToggleGroupItem value="60">60 dtk</ToggleGroupItem>
                                <ToggleGroupItem value="90">90 dtk</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </div>
                    <CardFooter>
                        <Button variant="ghost">Kembali</Button>
                        <Button>Render klip</Button>
                    </CardFooter>
                </Card>
            </Section>

            <Section title="Notice">
                <div className="space-y-2">
                    <Alert tone="info">
                        <Info {...icon} />
                        Lama proses tergantung durasi video.
                    </Alert>
                    <Alert tone="warning">
                        <TriangleAlert {...icon} />
                        Audio di menit 12 kurang jelas. Transkrip bagian ini mungkin kurang akurat.
                    </Alert>
                    <Alert tone="error">
                        <CircleX {...icon} />
                        File melebihi 2 GB. Kompres video atau potong bagian awal sebelum mengunggah.
                    </Alert>
                </div>
            </Section>

            <Section title="Progress, Tooltip, Toast">
                <Progress value={62} aria-label="Merender klip" />
                <div className="flex flex-wrap items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline">Arahkan ke sini</Button>
                        </TooltipTrigger>
                        <TooltipContent>Rasio 9:16 diterapkan otomatis.</TooltipContent>
                    </Tooltip>
                    <Button variant="outline" onClick={() => toast.success('Klip dibuat')}>
                        Tampilkan toast
                    </Button>
                </div>
            </Section>
        </div>
    );
}

export default function Design() {
    return (
        <TooltipProvider>
            <Head title="Design system" />
            <header className="flex h-14 items-center justify-between border-b px-4">
                <span className="text-[15px] font-semibold tracking-[-0.02em]">ClipTalk /_design</span>
                <AvatarMenu initials="NP" />
            </header>
            <main className="mx-auto grid w-full max-w-[1280px] gap-6 px-4 py-8 lg:grid-cols-2">
                <div className="light rounded-lg border bg-background p-4 text-foreground sm:p-6">
                    <h2 className="mb-6 text-2xl font-semibold tracking-tight">Tema terang</h2>
                    <Showcase />
                </div>
                <div className="dark rounded-lg border bg-background p-4 text-foreground sm:p-6">
                    <h2 className="mb-6 text-2xl font-semibold tracking-tight">Tema gelap</h2>
                    <Showcase />
                </div>
            </main>
            <Toaster />
        </TooltipProvider>
    );
}
