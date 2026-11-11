import { useCallback, useMemo, useRef, useState } from 'react';

import type { VideoPlayerHandle } from '@/components/cliptalk/video-player';
import type { TranscriptSegment } from '@/types/cliptalk';

/**
 * Satu sumber waktu untuk halaman Pilih bagian: video ↔ transkrip ↔ kandidat.
 * Pasang `playerRef` dan `onTimeUpdate` ke VideoPlayer, lalu pakai `seek` dan `playingId` di daftar.
 */
export function useVideoTime(segments: TranscriptSegment[]) {
    const playerRef = useRef<VideoPlayerHandle>(null);
    const [time, setTime] = useState(0);

    const seek = useCallback((sec: number) => playerRef.current?.seek(sec), []);

    const playingId = useMemo(() => segments.find((s) => time >= s.start && time < s.end)?.id ?? null, [segments, time]);

    return { playerRef, time, onTimeUpdate: setTime, seek, playingId };
}
