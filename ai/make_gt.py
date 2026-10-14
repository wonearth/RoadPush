#!/usr/bin/env python3
"""데이터팀 원본 시트(RoadPush_raw.xlsx)를 평가용 기록표 CSV로 바꾼다.

원본 시트의 규칙(이 스크립트가 가정하는 것)
  - 한 행 = 사진 1장, 이미지번호 9290 -> IMG_9290.HEIC
  - 같은 지점의 사진은 연속된 행이고, 현장판정은 그 지점의 첫 행에만 적혀 있다.
  - 날짜/시각 칸(1007, 1009 ...)은 촬영 차수가 바뀌는 첫 행에만 있다.
  - 현장판정 숫자: 1 정상 / 2 일부 잠식 / 3 통행 어려움 / 4 차도 우회 필요
  - 판정 칸이 세 개: 현장판정(기본), 2인, 다수(3인이상)

사용 예
  python make_gt.py --xlsx RoadPush_raw.xlsx --out 기록표_변환.csv
  python make_gt.py --xlsx RoadPush_raw.xlsx --label-col "현장판정" --out 기록표_1인.csv
"""
import argparse

import pandas as pd

STAGE = {1: "정상", 2: "일부 잠식", 3: "통행 어려움", 4: "차도 우회 필요"}
RATERS = ["현장판정", "2인", "다수(3인이상)"]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--xlsx", required=True)
    ap.add_argument("--out", default="기록표_변환.csv")
    ap.add_argument("--label-col", default="다수(3인이상)", choices=RATERS, help="평가의 기준으로 쓸 판정 칸")
    args = ap.parse_args()

    df = pd.read_excel(args.xlsx, sheet_name=0, usecols="A:J")
    df = df.dropna(subset=["이미지번호"]).copy()
    df["이미지번호"] = df["이미지번호"].astype(int)

    df["세션"] = df["날짜/시각"].ffill().astype(int).astype(str)
    df["spot_no"] = df["현장판정"].notna().cumsum()  # 판정이 적힌 행에서 새 지점이 시작
    if (df["spot_no"] == 0).any():
        print("경고: 첫 지점 판정 앞에 있는 행은 제외합니다:", int((df["spot_no"] == 0).sum()), "행")
        df = df[df["spot_no"] > 0].copy()

    fill = RATERS + ["보도 경계 유무", "비고"]
    for c in fill:
        df[c] = df.groupby("spot_no")[c].transform("first")
    df["위치설명"] = df["위치설명"].ffill()

    order = df.groupby("세션")["spot_no"].transform(lambda s: s.rank(method="dense")).astype(int)
    df["지점ID"] = df["세션"] + "-S" + order.astype(str).str.zfill(2)
    df["사진파일명"] = "IMG_" + df["이미지번호"].astype(str) + ".HEIC"

    bad = []
    for c in RATERS:
        v = pd.to_numeric(df[c], errors="coerce")
        bad += [(c, i) for i in df.index[v.isna() | ~v.isin([1, 2, 3, 4])]]
        df[c + "_n"] = v
    if bad:
        print("경고: 1~4가 아닌 판정이 있는 행:", bad[:10])

    out = pd.DataFrame({
        "지점ID": df["지점ID"],
        "사진파일명": df["사진파일명"],
        "현장판정": df[args.label_col + "_n"].map(STAGE),
        "판정_1인": df["현장판정_n"].map(STAGE),
        "판정_2인": df["2인_n"].map(STAGE),
        "판정_다수": df["다수(3인이상)_n"].map(STAGE),
        "장애물": df["보도 경계 유무"],  # 원본 칸 이름은 '보도 경계 유무'지만 장애물 종류가 적혀 있다
        "위치설명": df["위치설명"],
        "비고": df["비고"],
    })
    out.to_csv(args.out, index=False, encoding="utf-8-sig")

    spots = out.drop_duplicates("지점ID")
    print(f"사진 {len(out)}장 / 지점 {len(spots)}곳 -> {args.out}  (기준 판정: {args.label_col})")
    print("지점별 단계 분포:", spots["현장판정"].value_counts().reindex(list(STAGE.values())).fillna(0).astype(int).to_dict())

    a, b, c = (df.drop_duplicates("spot_no")[x + "_n"] for x in RATERS)
    for nm, x, y in [("1인 vs 2인", a, b), ("1인 vs 다수", a, c), ("2인 vs 다수", b, c)]:
        d = (x - y).abs()
        print(f"판정자끼리 일치({nm}): 정확히 {100 * (d == 0).mean():.0f}%, ±1단계 이내 {100 * (d <= 1).mean():.0f}%")


if __name__ == "__main__":
    main()
