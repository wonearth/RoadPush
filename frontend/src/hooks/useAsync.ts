"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  /** 같은 key 로 다시 불러온다 (저장·재분석 후 갱신용) */
  reload: () => Promise<void>;
}

const toError = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

/**
 * service 호출 결과를 상태로 관리하는 최소 훅. key 가 바뀌면 다시 불러온다.
 * (추후 SWR / React Query 로 교체 가능)
 */
export function useAsync<T>(fn: () => Promise<T>, key: string): AsyncState<T> {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const [state, setState] = useState<{ key: string | null; data?: T; error: Error | null }>({ key: null, error: null });

  useEffect(() => {
    let active = true;
    fnRef.current().then(
      (data) => active && setState({ key, data, error: null }),
      (e) => active && setState((s) => ({ key, data: s.data, error: toError(e) })),
    );
    return () => {
      active = false;
    };
  }, [key]);

  const reload = useCallback(async () => {
    try {
      const data = await fnRef.current();
      setState((s) => ({ ...s, data, error: null }));
    } catch (e) {
      setState((s) => ({ ...s, error: toError(e) }));
    }
  }, []);

  return { data: state.data, loading: state.key !== key, error: state.error, reload };
}
