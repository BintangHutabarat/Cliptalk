import type * as React from 'react';
type IconName = 'upload' | 'film' | 'check' | 'play' | 'download' | 'back' | 'close' | 'info' | 'alert' | 'scissors' | 'captions';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'; size?: 'sm' | 'md' | 'lg'; icon?: IconName; iconRight?: IconName }
export declare function Button(props: ButtonProps): React.ReactElement;
export interface BadgeProps { tone?: 'neutral' | 'outline' | 'range' | 'success' | 'warning' | 'destructive'; mono?: boolean; icon?: IconName; children?: React.ReactNode }
export declare function Badge(props: BadgeProps): React.ReactElement;
export interface IconProps { name: IconName; size?: number; label?: string; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;
export interface CardProps { title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; footer?: React.ReactNode; flush?: boolean; className?: string; children?: React.ReactNode }
export declare function Card(props: CardProps): React.ReactElement;
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { id: string; label: string; hint?: string; error?: string; maxLength?: number }
export declare function Input(props: InputProps): React.ReactElement;
export interface SwitchProps { id: string; checked: boolean; onChange?: (checked: boolean) => void; label?: string; description?: string; ariaLabel?: string }
export declare function Switch(props: SwitchProps): React.ReactElement;
export interface SegmentedControlProps<T = string | number> { options: { value: T; label: string }[]; value: T; onChange?: (value: T) => void; ariaLabel: string }
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement;
export interface StepperProps { current: 1 | 2 | 3 | 4; steps?: string[] }
export declare function Stepper(props: StepperProps): React.ReactElement;
export interface AppHeaderProps { current?: 1 | 2 | 3 | 4; steps?: string[]; initials?: string }
export declare function AppHeader(props: AppHeaderProps): React.ReactElement;
export interface DropzoneProps { onFile?: (file: File) => void; hint?: string; id?: string }
export declare function Dropzone(props: DropzoneProps): React.ReactElement;
export interface FileRowProps { name: string; duration: string; size: string; status?: React.ReactNode; onRemove?: () => void }
export declare function FileRow(props: FileRowProps): React.ReactElement;
export interface SettingRowProps { title: string; description?: string; id?: string; children?: React.ReactNode }
export declare function SettingRow(props: SettingRowProps): React.ReactElement;
/** Times are in seconds. */
export interface RangeBarProps { total: number; start: number; end: number; playhead?: number; ticks?: boolean; compact?: boolean }
export declare function RangeBar(props: RangeBarProps): React.ReactElement;
export interface TranscriptLineProps { time: number; text: string; speaker?: string; inRange?: boolean; playing?: boolean; onSelect?: () => void }
export declare function TranscriptLine(props: TranscriptLineProps): React.ReactElement;
export interface SegmentCandidateProps { title: string; start: number; end: number; total?: number; score?: number; selected?: boolean; onSelect?: () => void }
export declare function SegmentCandidate(props: SegmentCandidateProps): React.ReactElement;
export interface JobStage { label: string; state?: 'done' | 'active' | 'pending' | 'error'; meta?: string }
export interface JobProgressProps { percent: number; stages: JobStage[] }
export declare function JobProgress(props: JobProgressProps): React.ReactElement;
export interface ClipFrameProps { caption?: string; captionStyle?: 'outline' | 'plate'; showCaption?: boolean; duration?: number; current?: number; onPlay?: () => void; className?: string }
export declare function ClipFrame(props: ClipFrameProps): React.ReactElement;
export interface SpecListProps { items: { label: string; value: React.ReactNode; mono?: boolean }[] }
export declare function SpecList(props: SpecListProps): React.ReactElement;
export interface NoticeProps { tone?: 'info' | 'warning' | 'error'; children?: React.ReactNode }
export declare function Notice(props: NoticeProps): React.ReactElement;
declare global { interface Window { ClipTalk: { Button: typeof Button; Badge: typeof Badge; Icon: typeof Icon; Card: typeof Card; Input: typeof Input; Switch: typeof Switch; SegmentedControl: typeof SegmentedControl; Stepper: typeof Stepper; AppHeader: typeof AppHeader; Dropzone: typeof Dropzone; FileRow: typeof FileRow; SettingRow: typeof SettingRow; RangeBar: typeof RangeBar; TranscriptLine: typeof TranscriptLine; SegmentCandidate: typeof SegmentCandidate; JobProgress: typeof JobProgress; ClipFrame: typeof ClipFrame; SpecList: typeof SpecList; Notice: typeof Notice; timecode: (sec: number) => string } } }
