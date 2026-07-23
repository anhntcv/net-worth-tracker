## ✨ New Features

- Added a period selector (3M / 6M / YTD / 1A / 3A / All) to the net worth trend chart on the Overview page.
- Added an all-time-high badge that appears next to your net worth when you reach a new peak.
- Added a "driven by" summary on Overview showing which asset classes moved your net worth the most this month.
- Added a featured progress indicator for your most relevant active goal (Goal-Based Investing) on the Overview page.
- Added an operations register for your investments: from Patrimonio you can now record Buy, Sell, and Adjustment operations on each stock, ETF, bond, crypto, or commodity, with an optional settlement account whose balance updates automatically (net-worth-neutral).
- Added a per-asset "Movimenti" view with your full operation history plus realized P&L, total return, and money-weighted return (XIRR) for that asset.
- Added a live estimated realized-P&L preview when recording a sale, so you see the outcome before confirming.

## 🔧 Improvements

- New investments are now recorded as an opening purchase in the operations register, and quantity and average cost for tracked investments are managed through it — so editing an investment can no longer accidentally overwrite its cost basis.

- Overview now always shows a 12-month context line next to a negative monthly change, so a down month is never shown without the bigger picture.
- Large net worth values on the Overview hero no longer risk overflowing on smaller screens.
- Cost and tax figures (TER, annual cost, estimated taxes) on Overview now follow your selected color theme consistently.
- The Analisi page is easier to scan: the key numbers, warnings, and cash-flow chart stay up front, while the deeper comparison and trend sections now collapse behind a "Mostra dettaglio" toggle instead of always taking up the whole page.
- The cash-flow chart's drill-down breadcrumb is now fully clickable — jump straight back to any earlier step instead of clicking "Indietro" repeatedly.
- Your selected period on Analisi (Anno Corrente / Anno / Storico, plus year/month) is now saved in the page link, so refreshing or sharing the link keeps your view.
- When a month ends in deficit, Analisi now also shows your average savings rate over the last 12 months next to it, for context.
- All period, view, and range toggle controls can now be navigated with the arrow keys, not just the mouse.
- The spending-anomaly warning banner on Analisi now follows your selected color theme instead of a fixed amber color.

## 🔒 Security

- Updated several dependencies to resolve known security advisories (`npm audit fix`).
