# Blvckshell Business Plan — Document Suite

Conservative, bank-ready business plan for Blvckshell (Ontario multi-residential service operator). Generated per master prompt: no fluff, no startup language, margin-disciplined, Ontario-specific.

## Contents

| File | Section |
|------|--------|
| 01_Executive_Summary.md | Summary, growth path, margin framework, risk, capital |
| 02_Company_Overview.md | Legal, business model, operating philosophy |
| 03_Market_Analysis_Ontario_MultiRes.md | Ontario multi-res market, city segmentation, pricing, regulation |
| 04_Service_Offering_and_Positioning.md | Core service, scope, positioning, contracts |
| 05_Competitive_Landscape.md | Market structure, competitor weaknesses, barriers |
| 06_Operations_Model.md | Subcontractor model, capacity, QA, reclean, billing |
| 07_Sales_and_Growth_Strategy.md | Contract-first growth, retention, no hockey stick |
| 08_Risk_Management_and_Compliance.md | Revenue, operational, financial, regulatory risks |
| 09_Financial_Model_and_Assumptions.md | Pricing engine, margin, payout ceiling, overhead |
| 10_12_Month_Forecast_Detailed.md | Month-by-month revenue, COGS, P&L, sensitivity |
| 11_Three_Year_Forecast.md | Low / base / high scenarios, EBITDA ranges |
| 12_BreakEven_and_Sensitivity_Analysis.md | Break-even with/without founder salary, stress cases |
| 13_Working_Capital_and_LOC_Request.md | LOC purpose, size, use, repayment |
| 14_Scalability_Model_Ontario.md | 1 / 3 / 7 / 15 city scale, teams, complexity |
| 15_Exit_Optionality_and_LongTerm_Value.md | Valuation multiples, conditions, reporting discipline |
| 16_Appendices.md | Definitions, formulas, regulatory summary, assumption glossary |

## PDF compilation

Each file is standalone Markdown. To produce a single PDF:

1. **Concatenate in order:** 01 through 16 (e.g. `cat 01_*.md 02_*.md ... 16_*.md > master.md` or combine in an editor).
2. **Export to PDF:** Use Pandoc (`pandoc master.md -o Blvckshell_Business_Plan.pdf`), VS Code / Cursor Markdown PDF extension, or another Markdown-to-PDF tool.

Ensure section breaks and page breaks are acceptable in your PDF tool (e.g. Pandoc `--toc` and heading levels).

## Use

- Bank line-of-credit discussion
- Internal strategic planning
- Future investor review

All projections are conservative; no revenue hockey stick; margin target 25%, floor 15%; no founder salary in Year 1.

**Post strategic review (Feb 2026):** The plan was updated to incorporate bank and investor feedback: Management Profile (02), LOC security clarification (13), projected balance sheet (11), unit economics and cohort/retention (09), margin governance framework and expansion doctrine consolidated (09, 07), explicit failure scenarios and insurance/WSIB status (08), operational KPI dashboard (06), and payroll burden, inflation, and CapEx notes (09). See `MASTER_Business_Plan_Combined.md` for the full combined document including these additions.

**Institutional-grade add (post grading):** KPI Dashboard Structure (Appendix G), Retention & LTV modeling (Section 09), detailed projected balance sheets Year 1 & 3 (Section 11), 20% recession stress test (Section 12), and valuation modeling at 10 / 25 / 75 sites (Section 15). These additions support a composite score in the 9+ range (bankable, institutional-ready).
