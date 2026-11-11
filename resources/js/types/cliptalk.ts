// Kontrak data (SYSTEM-DESIGN.md §4). Jangan diubah tanpa memperbarui dokumen itu.
// Semua waktu dalam detik (number). Semua ukuran dalam byte.

export type ProjectStage = 'uploaded' | 'transcribing' | 'extracting' | 'ready' | 'failed';
export type ClipStage = 'draft' | 'queued' | 'rendering' | 'ready' | 'failed';
export type ClipDuration = 30 | 60 | 90;
export type CaptionStyle = 'outline' | 'plate';

export interface Project {
    id: string;
    fileName: string; // "podcast_teknologi_ep14.mp4"
    durationSec: number; // 2300
    sizeBytes: number; // 358612992
    mimeType: 'video/mp4' | 'video/quicktime' | 'video/webm';
    width: number;
    height: number;
    fps: number;
    sourceUrl: string; // URL video untuk <video>
    targetDuration: ClipDuration;
    language: 'id';
    stage: ProjectStage;
    error?: string | null;
    createdAt: string; // ISO
    expiresAt: string; // createdAt + 24 jam
}

export interface TranscriptWord {
    start: number;
    end: number;
    text: string;
    probability: number;
}
export interface TranscriptSegment {
    id: number;
    start: number;
    end: number;
    text: string;
    speaker?: string | null; // null di MVP (belum ada diarization)
    avgLogprob: number; // dari Faster-Whisper, untuk tanda "kurang yakin"
    words: TranscriptWord[];
}

export interface Candidate {
    id: string;
    projectId: string;
    title: string; // ≤ 60 karakter
    start: number;
    end: number;
    score: number; // 0–100
    reason: string; // alasan singkat (untuk evaluasi kualitatif)
    segmentIds: number[]; // TranscriptSegment yang tercakup
}

export interface Clip {
    id: string;
    projectId: string;
    candidateId: string | null; // null jika rentang diatur manual
    title: string;
    start: number;
    end: number;
    showCaptions: boolean;
    captionStyle: CaptionStyle;
    width: 1920;
    height: 1080;
    videoCodec: 'h264';
    audioCodec: 'aac';
    stage: ClipStage;
    progress: number; // 0–100
    outputUrl?: string | null;
    downloadUrl?: string | null;
    outputSizeBytes?: number | null;
    srtUrl?: string | null;
    sha256?: string | null;
    error?: string | null;
    expiresAt: string;
}

export interface JobStageItem {
    key: string;
    label: string;
    state: 'done' | 'active' | 'pending' | 'error';
    meta?: string;
}
export interface ProjectStatus {
    stage: ProjectStage;
    percent: number;
    stages: JobStageItem[];
    error?: string | null;
}
export interface ClipStatus {
    stage: ClipStage;
    percent: number;
    error?: string | null;
}
