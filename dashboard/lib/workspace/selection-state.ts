import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export const MAX_STUDY_UID_LENGTH = 128;

export function normalizeStudyUid(value: string | null | undefined): string | undefined {
  const uid = value?.trim();
  if (!uid || uid.length > MAX_STUDY_UID_LENGTH || !/^[0-9]+(?:\.[0-9]+)*$/.test(uid)) {
    return undefined;
  }
  return uid;
}

export function buildSelectionHref(pathname: string, currentQuery: string, uid?: string): string {
  const params = new URLSearchParams(currentQuery);
  const normalizedUid = normalizeStudyUid(uid);
  if (normalizedUid) params.set("study", normalizedUid);
  else params.delete("study");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function useSelectionUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlStudyUid = normalizeStudyUid(searchParams.get("study"));
  // Keep selection responsive even while a Next.js App Router navigation is
  // waiting for (or recovering from) an RSC request. Previously the URL was
  // the only source of truth, so a failed/delayed router.push made a valid row
  // click appear to do nothing and reset all dependent panels.
  const [studyUid, setStudyUid] = useState<string | undefined>(urlStudyUid);

  useEffect(() => {
    setStudyUid(urlStudyUid);
  }, [urlStudyUid]);

  const setSelection = useCallback(
    (uid?: string) => {
      const normalizedUid = normalizeStudyUid(uid);
      setStudyUid(normalizedUid);
      router.push(buildSelectionHref(pathname, searchParams.toString(), normalizedUid), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return {
    studyUid,
    setSelection,
  };
}
