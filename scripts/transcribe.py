
import argparse
import json
from pathlib import Path

from faster_whisper import WhisperModel


def main():
    parser = argparse.ArgumentParser(
        description="Transkripsi video menggunakan Faster-Whisper."
    )
    parser.add_argument("video", help="Path video yang akan ditranskripsi")
    parser.add_argument("output", help="Path file JSON hasil transkripsi")
    parser.add_argument("--model", default="base")
    args = parser.parse_args()

    video_path = Path(args.video).resolve()
    output_path = Path(args.output).resolve()

    if not video_path.is_file():
        raise FileNotFoundError(f"Video tidak ditemukan: {video_path}")

    print(f"Video: {video_path}")
    print(f"Model: {args.model}")
    print("Memuat model transkripsi...")

    model = WhisperModel(
        args.model,
        device="cpu",
        compute_type="int8",
    )

    segments, info = model.transcribe(
        str(video_path),
        language="id",
        beam_size=5,
        vad_filter=True,
    )

    results = []

    print("Mulai transkripsi...")

    for segment in segments:
        item = {
            "start": round(float(segment.start), 3),
            "end": round(float(segment.end), 3),
            "text": segment.text.strip(),
        }
        results.append(item)
        print(
            f"[{item['start']:.2f}s - {item['end']:.2f}s] "
            f"{item['text']}"
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)

    data = {
        "language": info.language,
        "language_probability": round(
            float(info.language_probability), 4
        ),
        "duration_sec": round(float(info.duration), 3),
        "segments": results,
    }

    output_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"\nTranskripsi selesai: {len(results)} segmen")
    print(f"Hasil disimpan di: {output_path}")


if __name__ == "__main__":
    main()
