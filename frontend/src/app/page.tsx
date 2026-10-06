import { ArrowDown, ArrowRight, Camera, Check, ClipboardCheck, Gauge, LogIn, MapPinned, RefreshCw, ScanSearch, Split, X } from "lucide-react";
import { HeroPreview } from "@/components/landing/HeroPreview";
import { PublicNav } from "@/components/landing/PublicNav";
import { Logo } from "@/components/layout/Logo";
import { RiskLegend } from "@/components/risk/RiskLegend";
import { ButtonLink } from "@/components/ui/Button";

const WORKFLOW = [
  { icon: Camera, title: "영상 확보", body: "CCTV · 블랙박스 · 현장 촬영" },
  { icon: ScanSearch, title: "AI 분석", body: "보도·차도 구분, 장애요인 탐지" },
  { icon: Split, title: "단절 판단", body: "남은 보행공간의 연속성 판단" },
  { icon: Gauge, title: "위험도 산출", body: "0~100점 단계화 · 지도화" },
  { icon: ClipboardCheck, title: "현장조치", body: "위험도 높은 구간부터 우선 점검" },
  { icon: RefreshCw, title: "개선 확인", body: "동일 구간 재분석 · 전후 비교" },
];

const FEATURES = [
  {
    icon: ScanSearch,
    title: "AI 보행공간 분석",
    body: "도로·보행 영상에서 보도와 차도를 구분하고 주정차 차량, 공사시설, 적치물, 방치 PM 등 보행 방해 요인을 탐지합니다.",
    points: ["보도·차도 영역 구분", "장애요인 탐지", "유효 보행공간 산출"],
  },
  {
    icon: Gauge,
    title: "보행공간 단절 위험도 산출",
    body: "장애물의 종류가 아니라 실제 남아 있는 보행공간의 연속성, 공간 잠식 정도, 차도 우회 필요 여부로 위험도를 판단합니다.",
    points: ["0~100점 위험도", "안전·주의·경고·위험 4단계", "위험 원인 함께 제시"],
  },
  {
    icon: MapPinned,
    title: "위험구간 지도화 및 관리",
    body: "위험구간을 지도에 표시하고 우선점검 → 현장조치 → 재분석까지 관리해 조치 전·후 개선효과를 정량적으로 확인합니다.",
    points: ["우선점검 구간 제시", "조치 상태 관리", "조치 전·후 비교"],
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-slate-50/70">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
              AI 기반 보행공간 단절 탐지 및 위험도 관리 서비스
            </p>
            <h1 className="mt-5 text-[34px] leading-[1.25] font-bold tracking-tight text-slate-900 sm:text-[44px]">
              {/* 모바일에서는 "보행자를 차도로 / 밀어내는 길," 로 자연스럽게 줄바꿈 */}
              <span className="whitespace-nowrap">보행자를 차도로</span>{" "}
              <span className="whitespace-nowrap">밀어내는 길,</span>
              <br />
              <span className="text-brand-600">사고 전에</span> 발견합니다.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
              RoadPush는 주정차 차량·공사시설·적치물·방치 PM 등으로 보행공간이 끊겨 보행자가 차도로 내려가야 하는 구간을
              AI로 찾아내고, 지자체·도로관리기관이 우선순위에 따라 조치할 수 있도록 돕습니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/login" size="lg" icon={<LogIn className="size-4" />}>
                관리자 로그인
              </ButtonLink>
              <ButtonLink href="#about" size="lg" variant="secondary" icon={<ArrowDown className="size-4" />}>
                서비스 소개 보기
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-slate-400">※ MVP의 모든 화면은 개발용 mock 데이터로 구성되어 있습니다.</p>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* 핵심 질문 + 차별점 */}
      <section id="about" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-brand-600">RoadPush의 핵심 질문</p>
            <blockquote className="mt-4 text-2xl leading-snug font-bold text-slate-900 sm:text-[32px]">
              &ldquo;무엇이 놓여 있는가가 아니라,
              <br />
              보행자가 <span className="underline decoration-brand-300 decoration-4 underline-offset-[6px]">계속 걸을 수 있는 공간</span>이 남아 있는가?&rdquo;
            </blockquote>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <p className="text-sm font-bold text-slate-500">기존 방식</p>
              <ul className="mt-5 space-y-4">
                {["개별 장애물 중심 탐지", "사고·민원 발생 이후 관리"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[17px] font-semibold text-slate-500">
                    <span className="flex size-7 items-center justify-center rounded-full bg-slate-200">
                      <X className="size-4 text-slate-500" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-7">
              <p className="text-sm font-bold text-brand-700">RoadPush</p>
              <ul className="mt-5 space-y-4">
                {["실제 남아 있는 보행공간 판단", "사고 이전 위험구간 발견"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[17px] font-semibold text-slate-900">
                    <span className="flex size-7 items-center justify-center rounded-full bg-brand-600">
                      <Check className="size-4 text-white" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Workflow */}
          <div className="mt-20">
            <h2 className="text-center text-xl font-bold text-slate-900">발견에서 개선 확인까지, 하나의 관리 흐름</h2>
            <ol className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {WORKFLOW.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="relative rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="tabular text-xs font-bold text-slate-300">0{i + 1}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
                  {i < WORKFLOW.length - 1 && (
                    <ArrowRight className="absolute top-1/2 -right-[11px] z-10 hidden size-4 -translate-y-1/2 rounded-full bg-white text-slate-300 lg:block" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section id="features" className="scroll-mt-16 border-t border-slate-200 bg-slate-50/70">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-brand-600">주요 기능</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">관리자가 &lsquo;어디부터 점검할지&rsquo; 바로 판단합니다</h2>
            </div>
            <RiskLegend />
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body, points }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
                <ul className="mt-5 space-y-1.5 border-t border-slate-100 pt-4">
                  {points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[13px] text-slate-700">
                      <Check className="size-3.5 text-brand-600" /> {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-brand-900 px-8 py-8 text-white md:flex-row">
            <div>
              <p className="text-lg font-bold">지자체·도로관리기관을 위한 보행안전 관리 플랫폼</p>
              <p className="mt-1 text-sm text-brand-200">기관 계정으로 로그인해 위험구간을 확인하고 현장조치를 관리하세요.</p>
            </div>
            <ButtonLink href="/login" size="lg" variant="inverse">
              관리자 로그인 <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-slate-400 sm:flex-row sm:px-6">
          <Logo />
          <p>RoadPush MVP · 2026 AI 라이프 아이디어 챌린지 · 이화여자대학교</p>
        </div>
      </footer>
    </div>
  );
}
