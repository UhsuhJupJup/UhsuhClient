import type { Note } from "@/lib/types";

export function NoteAnalysisBadge({ note }: { note: Pick<Note, "analysisStatus" | "recommendationReady"> }) {
  if (note.recommendationReady) {
    return (
      <span className="inline-flex items-center text-[11px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-md">
        추천 준비 완료
      </span>
    );
  }
  if (note.analysisStatus === "PENDING") {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold text-muted bg-chip-bg px-2 py-0.5 rounded-md">
        분석 중
      </span>
    );
  }
  if (note.analysisStatus === "FAILED") {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold text-danger bg-chip-bg px-2 py-0.5 rounded-md">
        분석 실패
      </span>
    );
  }
  return null;
}
