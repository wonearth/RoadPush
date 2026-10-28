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

/** 응답이 오지 않는 경우(브라우저에서 연결이 멈춘 경우 등) 빈 화면에 머물지 않도록 이 시간이 지나면 실패로 본다 */
const TIMEOUT_MS = 20_000;
const withTimeout = <T,>(p: Promise<T>) =>
  Promise.race([
    p,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("응답 시간이 초과되었습니다")), TIMEOUT_MS)),
  ]);

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
    withTimeout(fnRef.current()).then(
      (data) => active && setState({ key, data, error: null }),
      (e) => active && setState((s) => ({ key, data: s.data, error: toError(e) })),
    );
    return () => {
      active = false;
    };
  }, [key]);

  const reload = useCallback(async () => {
    try {
      const data = await withTimeout(fnRef.current());
      // 첫 불러오기가 끝나지 않은 채 다시 불러온 경우에도 로딩 상태를 끝낸다
      setState({ key, data, error: null });
    } catch (e) {
      setState((s) => ({ ...s, key, error: toError(e) }));
    }
  }, [key]);

  return { data: state.data, loading: state.key !== key, error: state.error, reload };
}
