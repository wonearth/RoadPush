"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { EmptyState, Spinner } from "./States";

/** 데이터를 불러오지 못했을 때 — 빈 화면 대신 이유와 '다시 시도' 버튼을 보여준다 */
export function LoadError({ onRetry, className }: { onRetry: () => Promise<void>; className?: string }) {
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };
  return (
    <EmptyState
      className={className}
      icon={<WifiOff className="size-8" />}
      title="데이터를 불러오지 못했습니다"
      description="인터넷 연결을 확인한 뒤 다시 시도해 주세요."
      action={
        <Button variant="secondary" onClick={retry} disabled={retrying} icon={retrying ? <Spinner /> : <RefreshCw className="size-4" />}>
          다시 시도
        </Button>
      }
    />
  );
}
