"use client";

import { useEffect, useState } from "react";

/**
 * Keeps client state aligned with server props when they change after
 * `router.refresh()` or navigation (Next.js App Router + RSC).
 */
export function useSyncedState<T>(
  serverValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState(serverValue);
  useEffect(() => {
    setState(serverValue);
  }, [serverValue]);
  return [state, setState];
}
