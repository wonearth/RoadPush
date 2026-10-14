# ai

보도·장애물 인식과 보행공간 단절 위험도(0~100) 산출.

| 파일 | 역할 |
|---|---|
| `roadpush_score.py` | 사진 폴더 → 위험도 CSV (CLI). `analyze_image()`가 핵심 |
| `roadpush_engine.py` | 한 장 분석 결과를 프론트 응답 형식(AnalysisApiResponse)으로 변환. backend가 사용 |
| `roadpush_eval.py` | 현장판정(기록표)과 AI 점수 비교 |
| `make_gt.py` | 데이터팀 기록표(xlsx) → 평가용 CSV |
| `config.json` | 모델·임계값 설정 |
| `config.private.json` | **깃에 올리지 않는다.** 점수 가중치. `.gitignore`에 `ai/config.private.json` 추가 |

```bash
pip install -r requirements.txt
python roadpush_score.py --images ./photos --out preds.csv --vis ./vis --owl
python roadpush_eval.py --gt 기록표_변환.csv --pred ours=preds.csv --thresholds 10 50 75
```

현재 설정은 OWL 켬, 박스 축소 0.1, 안전 경계 10(`stage_thresholds`)이다. 서비스 화면은 이를 25/50/75 경계로
보정해서 보여준다(`service.display_thresholds`). 사진 폴더와 AI Hub 데이터는 깃에 올리지 않는다.
