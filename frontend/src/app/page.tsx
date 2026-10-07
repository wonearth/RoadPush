import Image from "next/image";
import { PublicNav } from "@/components/landing/PublicNav";
import { Logo } from "@/components/layout/Logo";
import { MediaFrame } from "@/components/media/MediaFrame";
import { ButtonLink } from "@/components/ui/Button";
import { RISK_LEVELS, RISK_META } from "@/constants/risk";
import { MOCK_SAMPLE_OVERLAY, MOCK_SAMPLE_SCENE_URL } from "@/mocks/mockOverlay";

const STATS = [
  { value: "35,356건", label: "2025년 보행자 교통사고" },
  { value: "926명", label: "보행자 사망" },
  { value: "11,498건", label: "노인 보행자 교통사고" },
];

const STEPS = [
  { tag: "01 발견", title: "남은 보행공간을 분석해요", body: "장애물의 종류가 아니라 실제로 걸을 수 있는 공간이 얼마나 남았는지로 위험도(0~100)를 계산해요." },
  { tag: "02 조치", title: "위험한 곳부터 점검해요", body: "위험지도와 우선점검 목록으로 담당자가 어디부터 가야 할지 바로 판단해요." },
  { tag: "03 확인", title: "개선 효과를 숫자로 봐요", body: "조치 후 같은 구간을 다시 분석해 위험도와 보행공간이 얼마나 나아졌는지 비교해요." },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-bold text-brand-600 sm:text-lg">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-3 text-[28px] leading-snug font-extrabold tracking-tight text-slate-900 sm:text-[40px]">{children}</h2>;
}

export default function LandingPage() {
  return (
    <div className="bg-white">
      <PublicNav />

      {/* 첫 화면 */}
      <section className="px-5 pt-14 text-center sm:px-8 sm:pt-20">
        <h1 className="text-[34px] leading-[1.28] font-extrabold tracking-tight text-slate-900 sm:text-[58px]">
          <span className="whitespace-nowrap">보행자를 차도로</span> <span className="whitespace-nowrap">밀어내는 길,</span>
          <br />
          <span className="text-brand-600">사고 전에</span> 발견합니다
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-slate-600 sm:text-xl">
          주정차 차량·공사시설·적치물·방치 킥보드·자전거로 보도가 끊긴 곳을 AI가 찾아내고, 지자체가 위험한 곳부터 조치할 수 있도록
          돕습니다.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/login" size="lg">
            관리자 로그인
          </ButtonLink>
          <ButtonLink href="#about" size="lg" variant="secondary">
            서비스 소개 보기
          </ButtonLink>
        </div>
        <div className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-t-3xl bg-slate-100 px-3 pt-3 sm:px-7 sm:pt-7">
          <Image
            src="/landing/riskmap-preview.jpg"
            alt="RoadPush 보행공간 단절 위험지도 화면"
            width={2160}
            height={1350}
            priority
            className="block w-full rounded-t-2xl shadow-[0_10px_40px_rgba(25,31,40,0.12)]"
          />
        </div>
      </section>

      {/* 왜 필요한가요 */}
      <section id="about" className="scroll-mt-18 bg-slate-100 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>왜 필요한가요</Eyebrow>
          <SectionTitle>
            보행자 사고는 여전히 많지만,
            <br />
            사고가 나기 전의 위험은 관리되지 않습니다
          </SectionTitle>
          <dl className="mt-10 flex flex-wrap gap-x-16 gap-y-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="tabular text-[40px] leading-none font-extrabold tracking-tight text-slate-900 sm:text-[52px]">{s.value}</dt>
                <dd className="mt-2 text-base text-slate-600 sm:text-lg">{s.label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-7 text-sm text-slate-500">출처: 한국도로교통공단 교통사고분석시스템(TAAS), 「2025년 보행자 교통사고 통계」</p>
        </div>
      </section>

      {/* RoadPush의 질문 */}
      <section className="px-5 py-16 text-center sm:px-8 sm:py-20">
        <Eyebrow>RoadPush의 질문</Eyebrow>
        <p className="mt-4 text-[26px] leading-snug font-extrabold tracking-tight text-slate-900 sm:text-[40px]">
          무엇이 놓여 있는가가 아니라,
          <br />
          보행자가 <span className="text-brand-600">계속 걸을 수 있는 공간</span>이 남아 있는가?
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 text-left sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-100 p-7">
            <p className="text-base font-semibold text-slate-500">기존 방식</p>
            <ul className="mt-3 space-y-2 text-lg font-bold text-slate-500 sm:text-xl">
              <li>개별 장애물 중심 탐지</li>
              <li>사고·민원 발생 이후 관리</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-brand-50 p-7">
            <p className="text-base font-semibold text-brand-600">RoadPush</p>
            <ul className="mt-3 space-y-2 text-lg font-bold text-slate-900 sm:text-xl">
              <li>실제 남아 있는 보행공간 판단</li>
              <li>사고 이전 위험구간 발견</li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI가 보는 것 */}
      <section className="bg-slate-100 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>AI가 보는 것</Eyebrow>
          <SectionTitle>사진 한 장에서 남은 보행공간을 계산해요</SectionTitle>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <figure className="rounded-2xl bg-white p-4">
              <figcaption className="mb-3 px-1 font-semibold text-slate-700">원본 사진</figcaption>
              <MediaFrame variant="original" src={MOCK_SAMPLE_SCENE_URL} overlay={MOCK_SAMPLE_OVERLAY} />
            </figure>
            <figure className="rounded-2xl bg-white p-4">
              <figcaption className="mb-3 px-1 font-semibold text-slate-700">AI 분석 결과 · 보도·장애물·남은 보행공간</figcaption>
              <MediaFrame
                variant="result"
                src={MOCK_SAMPLE_SCENE_URL}
                overlay={MOCK_SAMPLE_OVERLAY}
                walkableRatio={0.31}
                roadDetourRequired
              />
            </figure>
          </div>
          <dl className="mt-7 flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <dt className={`tabular text-[40px] leading-none font-extrabold ${RISK_META.DANGER.text}`}>82</dt>
              <dd className="mt-1.5 text-slate-600">단절 위험도 · 위험</dd>
            </div>
            <div>
              <dt className="tabular text-[40px] leading-none font-extrabold text-[#16a34a]">31%</dt>
              <dd className="mt-1.5 text-slate-600">유효 보행공간</dd>
            </div>
            <div>
              <dt className="text-[40px] leading-none font-extrabold text-slate-900">있음</dt>
              <dd className="mt-1.5 text-slate-600">차도 우회 필요</dd>
            </div>
          </dl>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RISK_LEVELS.map((lv) => (
              <li key={lv} className="rounded-xl bg-white px-5 py-4">
                <p className={`text-lg font-bold ${RISK_META[lv].text}`}>{RISK_META[lv].label}</p>
                <p className="tabular mt-0.5 text-[15px] text-slate-600">
                  {RISK_META[lv].min}~{RISK_META[lv].max} · {RISK_META[lv].description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 어떻게 동작하나요 */}
      <section id="how" className="scroll-mt-18 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>어떻게 동작하나요</Eyebrow>
          <SectionTitle>발견부터 개선 확인까지, 한 흐름으로</SectionTitle>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.tag} className="border-t-[3px] border-slate-900 pt-5">
                <p className="font-bold text-brand-600">{s.tag}</p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{s.title}</p>
                <p className="mt-2.5 text-[17px] leading-relaxed text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 마지막 안내 */}
      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 rounded-2xl bg-brand-50 px-7 py-7 sm:flex-row sm:items-center sm:px-9">
          <div>
            <p className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">지자체·도로관리기관을 위한 보행안전 관리 플랫폼</p>
            <p className="mt-1.5 text-base text-slate-600 sm:text-[17px]">기관 계정으로 로그인해 위험구간을 확인하고 현장조치를 관리하세요.</p>
          </div>
          <ButtonLink href="/login" size="lg" className="shrink-0">
            관리자 로그인
          </ButtonLink>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:px-8">
          <Logo />
          <p>RoadPush MVP · 2026 AI 라이프 아이디어 챌린지 · 이화여자대학교</p>
        </div>
      </footer>
    </div>
  );
}
