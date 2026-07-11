import { useCallback } from "react";
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

  const studyUid = normalizeStudyUid(searchParams.get("study"));

  const setSelection = useCallback(
    (uid?: string) => {
      router.push(buildSelectionHref(pathname, searchParams.toString(), uid), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return {
    studyUid,
    setSelection,
  };
}
