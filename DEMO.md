# AgriSaarthi — SIH Demo Script (one continuous story)

Total: ~8 minutes. Demo farmer: **Ramesh Patil, Pune, Maharashtra, 2.5 acres, Tomato, Fruiting.**

1. **Open app → Demo Mode** (0:30). No signup friction. Lands on Home.
2. **Home: "What should I do today?"** (1:00). Show 3–5 live cards from `GET /today-actions`:
   - Rain expected tomorrow → delay irrigation (reason shown)
   - Disease risk elevated (humidity) → inspect lower leaves
   - Market trend: tomato prices up → compare nearby markets
3. **Crop recommendation** (More → Crop Recommendation) (1:00). Input soil, see ranked: Soybean 91%, Maize 82%, Cotton 76% with factors + estimated profitability.
4. **Back to Home → Weather → Irrigation** (1:00). Raw weather vs AI interpretation, separated. Irrigation: WAIT (81% rain prob, soil 42% vs need 48%).
5. **SCAN tab** (1:30). Upload diseased tomato leaf → quality check → inference → "Probable Tomato Early Blight", confidence 92%, severity HIGH, model v1.
6. **Risk engine** (0:30). Disease + weather + stage + region → Risk 87/100 HIGH with factors listed.
7. **AI tab — "मेरी फसल के लिए आज क्या करना चाहिए?"** (1:00). Assistant answers in Hindi using farm context (crop, stage, weather, risk).
8. **Market intelligence** (0:45). Tomato 1,200 kg: market, ₹/kg, distance, transport, net. Sort by highest/net. Trend labeled ESTIMATED.
9. **Profitability + buyer** (0:45). Cost → revenue → profit, deterministic math. Marketplace → contact buyer.
10. **My Farm record** (0:30). Timeline: planted → fertilizer → scan → alert → harvest. Expenses, yield, profit.
11. **Expert escalation** (if asked). Low-confidence/high-risk → "Need expert verification?" case stored.

Close: "Every screen followed DATA → WHAT DOES IT MEAN → WHAT SHOULD I DO → WHAT HAPPENS NEXT."
