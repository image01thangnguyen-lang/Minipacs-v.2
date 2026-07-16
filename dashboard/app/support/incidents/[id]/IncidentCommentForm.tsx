"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { addIncidentComment } from "../actions";

export default function IncidentCommentForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isScrubbed, setIsScrubbed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!isScrubbed) {
      alert("You must explicitly attest that the comment contains no PHI.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addIncidentComment(ticketId, content, isScrubbed);
      setContent("");
      setIsScrubbed(false);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-start gap-2 text-sm text-orange-800 bg-orange-50 p-2 rounded border border-orange-200">
        <ShieldAlert className="w-4 h-4 shrink-0 text-orange-600 mt-0.5" />
        <p>Ensure this comment contains <strong>NO PHI</strong> (Patient Names, MRN, Accession IDs).</p>
      </div>

      <textarea
        placeholder="Add a comment..."
        value={content}
        onChange={e => setContent(e.target.value)}
        className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={isSubmitting}
      />

      <div className="flex justify-between items-center pt-1">
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={isScrubbed}
            onChange={e => setIsScrubbed(e.target.checked)}
            disabled={isSubmitting || !content.trim()}
            className="rounded border-vin-border w-3.5 h-3.5"
          />
          <span className="font-medium">I confirm there is no PHI in this comment.</span>
        </label>
        <button
          type="submit"
          disabled={!content.trim() || !isScrubbed || isSubmitting}
          className="rounded bg-vin-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-vin-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </form>
  );
}
