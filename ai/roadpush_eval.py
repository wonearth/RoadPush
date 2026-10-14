#!/usr/bin/env python3
"""현장판정(정답)과 AI 위험도를 비교하는 평가 스크립트.

입력
  --gt    기록표를 CSV로 내려받은 파일. 컬럼: 지점ID, 현장판정 (선택: split, 사진파일명)
          사진 파일명이 IMG_9296처럼 지점ID로 시작하지 않으면, 기록표에 사진파일명 컬럼을 두면 된다.
          폴더가 여러 개이고 파일명이 겹치면 '1007-1차/IMG_9296.HEIC'처럼 폴더를 포함해 적는다.
  --pred  roadpush_score.py가 만든 CSV (photo, riskScore 컬럼). "이름=경로" 형태로 여러 개 가능

사용 예
  python roadpush_eval.py --gt 기록표.csv --pred ours=preds.csv
  python roadpush_eval.py --gt 기록표.csv --pred baseline=preds_base.csv ours=preds.csv --out report.md
  python roadpush_eval.py --gt 기록표.csv --pred ours=preds.csv --split final   # 최종 검증용 지점만

현장판정 4단계와 위험 4단계는 같은 순서로 대응시킨다.
  정상=안전(0~25), 일부 잠식=주의(26~50), 통행 어려움=경고(51~75), 차도 우회 필요=위험(76~100)
"""
import argparse
import unicodedata
from pathlib import Path

import numpy as np
import pandas as pd

LABELS = ["정상", "일부 잠식", "통행 어려움", "차도 우회 필요"]
KEY = {name.replace(" ", ""): i for i, name in enumerate(LABELS)}


def pkey(s):
    """사진 이름을 비교용 키로 바꾼다: 경로 구분자 통일, 확장자 제거, 소문자, 한글 정규화(NFC)."""
    s = unicodedata.normalize("NFC", str(s).strip()).replace("\\", "/")
    head, _, last = s.rpartition("/")
    if "." in last:
        last = last.rsplit(".", 1)[0]
    return (head + "/" + last if head else last).lower()


def spot_id(photo):
    """S01_1_20261010_1830.jpg -> S01"""
    return Path(str(photo)).stem.split("_")[0]


def score_to_stage(score, thresholds):
    return int(sum(score > t for t in thresholds))


def load_gt(path, id_col, label_col, split, photo_col="사진파일명"):
    """반환: (지점별 정답 표, {사진 파일명(확장자 없이, 소문자): 지점ID} 또는 None)"""
    df = pd.read_csv(path, encoding="utf-8-sig")
    for col in (id_col, label_col):
        if col not in df.columns:
            raise SystemExit(f"기록표에 '{col}' 컬럼이 없습니다. 있는 컬럼: {list(df.columns)}")
    if split:
        if "split" not in df.columns:
            raise SystemExit("--split을 쓰려면 기록표에 split 컬럼이 필요합니다.")
        df = df[df["split"].astype(str) == split]
    keys = df[label_col].astype(str).str.replace(" ", "", regex=False)
    unknown = sorted(set(keys) - set(KEY))
    if unknown:
        raise SystemExit(f"알 수 없는 현장판정 값: {unknown}. 사용 가능: {LABELS}")
    spot = df[id_col].astype(str).str.strip()
    mapping = None
    if photo_col in df.columns:
        full = {pkey(x): s for x, s in zip(df[photo_col], spot)}
        names = [pkey(x).rsplit("/", 1)[-1] for x in df[photo_col]]
        counts = pd.Series(names).value_counts()
        base = {n: s for n, s in zip(names, spot) if counts[n] == 1}  # 이름이 겹치면 폴더까지 적어야 한다
        mapping = {"full": full, "base": base}
    return pd.DataFrame({"spot": spot, "gt": keys.map(KEY)}).drop_duplicates("spot"), mapping


def load_pred(spec, mapping=None):
    name, _, path = spec.partition("=")
    if not path:
        name, path = Path(spec).stem, spec
    df = pd.read_csv(path, encoding="utf-8-sig")
    if not {"photo", "riskScore"} <= set(df.columns):
        raise SystemExit(f"{path}에는 photo, riskScore 컬럼이 필요합니다.")
    if mapping:  # 기록표의 사진파일명으로 지점을 찾고, 없으면 파일명 앞부분(지점ID)으로 대신 찾는다
        df["spot"] = [mapping["full"].get(pkey(x)) or mapping["base"].get(pkey(x).rsplit("/", 1)[-1]) or spot_id(x)
                      for x in df["photo"]]
    else:
        df["spot"] = df["photo"].map(spot_id)
    df["riskScore"] = pd.to_numeric(df["riskScore"], errors="coerce")
    return name, df


def qw_kappa(y_true, y_pred, k=4):
    """이차 가중 kappa. 단계가 멀리 틀릴수록 더 크게 감점한다. 1이면 완전 일치, 0이면 우연 수준."""
    obs = np.zeros((k, k))
    for a, b in zip(y_true, y_pred):
        obs[a, b] += 1
    w = np.array([[(i - j) ** 2 for j in range(k)] for i in range(k)]) / (k - 1) ** 2
    exp = np.outer(obs.sum(1), obs.sum(0)) / obs.sum()
    denom = (w * exp).sum()
    return float("nan") if denom == 0 else 1.0 - (w * obs).sum() / denom


def detection(m, cut, pred_cut=None):
    """정답이 cut단계 이상인 지점을 AI가 pred_cut단계 이상(기본은 cut과 같음)으로 잡았는지."""
    pred_cut = cut if pred_cut is None else pred_cut
    gt_pos, pr_pos = m["gt"] >= cut, m["pred"] >= pred_cut
    tp = int((gt_pos & pr_pos).sum())
    fp = int((~gt_pos & pr_pos).sum())
    fn = int((gt_pos & ~pr_pos).sum())
    prec = tp / (tp + fp) if tp + fp else float("nan")
    rec = tp / (tp + fn) if tp + fn else float("nan")
    f1 = 2 * prec * rec / (prec + rec) if prec == prec and rec == rec and prec + rec else float("nan")
    return prec, rec, f1, int(gt_pos.sum())


def evaluate(gt, pred, thresholds, agg):
    per_spot = pred.groupby("spot")["riskScore"].agg(agg).rename("riskScore").reset_index()
    m = gt.merge(per_spot, on="spot", how="left")
    n_gt = len(m)
    m = m.dropna(subset=["riskScore"]).copy()
    n = len(m)
    m["pred"] = m["riskScore"].map(lambda s: score_to_stage(s, thresholds))

    diff = (m["pred"] - m["gt"]).abs()
    out = {
        "평가 지점 수": n,
        "정답은 있으나 예측 없음": n_gt - n,
        "단계 정확히 일치": diff.eq(0).mean(),
        "±1단계 이내 일치": diff.le(1).mean(),
        "평균 단계 오차": diff.mean(),
        "가중 kappa": qw_kappa(m["gt"].tolist(), m["pred"].tolist()),
        "Spearman(점수, 정답 단계)": m["riskScore"].corr(m["gt"], method="spearman"),
    }
    for label, cut, pcut in (("단절(차도 우회 필요)", 3, 3), ("위험구간(통행 어려움 이상)", 2, 2),
                             ("경보(정답 통행 어려움 이상 / 예측 일부 잠식 이상)", 2, 1)):
        p, r, f1, npos = detection(m, cut, pcut)
        out[f"{label} Precision"] = p
        out[f"{label} Recall"] = r
        out[f"{label} F1"] = f1
        out[f"{label} 정답 지점 수"] = npos
    conf = pd.crosstab(m["gt"], m["pred"]).reindex(index=range(4), columns=range(4), fill_value=0)
    conf.index = [f"정답: {x}" for x in LABELS]
    conf.columns = [f"예측: {x}" for x in LABELS]
    return out, conf, m


def fmt(v):
    if isinstance(v, (int, np.integer)):
        return str(v)
    return "-" if v != v else f"{v:.3f}"


def to_markdown(df, index=True):
    cols = ([df.index.name or ""] if index else []) + [str(c) for c in df.columns]
    lines = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    for idx, row in df.iterrows():
        cells = ([str(idx)] if index else []) + [str(v) for v in row]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--gt", required=True)
    ap.add_argument("--pred", nargs="+", required=True)
    ap.add_argument("--gt-id-col", default="지점ID")
    ap.add_argument("--gt-label-col", default="현장판정")
    ap.add_argument("--gt-photo-col", default="사진파일명", help="기록표에 사진 파일명 컬럼이 있으면 그것으로 지점을 맞춘다")
    ap.add_argument("--thresholds", type=float, nargs=3, default=[25, 50, 75])
    ap.add_argument("--agg", choices=["max", "mean"], default="max", help="한 지점의 사진이 여러 장일 때 점수 합치는 방식")
    ap.add_argument("--split", default=None, help="기록표 split 컬럼 값으로 지점을 걸러낸다")
    ap.add_argument("--out", default=None, help="결과를 마크다운으로 저장")
    ap.add_argument("--detail", default=None, help="지점별 정답/예측을 CSV로 저장 (어느 지점이 틀렸는지 확인용)")
    args = ap.parse_args()

    gt, mapping = load_gt(args.gt, args.gt_id_col, args.gt_label_col, args.split, args.gt_photo_col)
    print(f"정답 지점 {len(gt)}개 (단계별: " + ", ".join(f"{LABELS[i]} {int((gt['gt'] == i).sum())}" for i in range(4)) + ")")

    summary, confs, details = {}, {}, {}
    for spec in args.pred:
        name, pred = load_pred(spec, mapping)
        summary[name], confs[name], details[name] = evaluate(gt, pred, args.thresholds, args.agg)

    if args.detail:
        base = gt.copy()
        base["정답"] = base["gt"].map(lambda i: LABELS[i])
        tbl = base[["spot", "정답"]]
        for name, m in details.items():
            part = m[["spot", "riskScore", "pred"]].rename(columns={"riskScore": f"{name}_점수", "pred": f"{name}_단계"})
            part[f"{name}_단계"] = part[f"{name}_단계"].map(lambda i: LABELS[i])
            part[f"{name}_점수"] = part[f"{name}_점수"].round(1)
            tbl = tbl.merge(part, on="spot", how="left")
        tbl.rename(columns={"spot": "지점ID"}).to_csv(args.detail, index=False, encoding="utf-8-sig")
        print(f"지점별 결과 저장: {args.detail}")

    table = pd.DataFrame({k: {m: fmt(v) for m, v in d.items()} for k, d in summary.items()})
    table.index.name = "지표"
    print("\n" + table.to_string())
    for name, conf in confs.items():
        print(f"\n혼동행렬 ({name})\n" + conf.to_string())
    if len(gt) < 30:
        print(f"\n주의: 지점이 {len(gt)}개뿐이라 수치가 크게 흔들립니다. 방향 확인용으로만 보세요.")

    if args.out:
        parts = ["# RoadPush 평가 결과", "", f"- 정답 지점 수: {len(gt)}", f"- 지점 내 사진 합산: {args.agg}", "", to_markdown(table)]
        for name, conf in confs.items():
            conf.index.name = name
            parts += ["", f"## 혼동행렬: {name}", "", to_markdown(conf)]
        Path(args.out).write_text("\n".join(parts) + "\n", encoding="utf-8")
        print(f"\n저장: {args.out}")


if __name__ == "__main__":
    main()
