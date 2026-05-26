## ✨ New Features

- Added a **total summary row** to all expense drill-down views in the Cashflow Analisi tab. When drilling into any Sankey node or pie chart category, a "Totale (N voci)" row now appears at the bottom of the transaction list showing the aggregated sum — so you can see the full amount at a glance without scrolling through every entry. Available on both desktop (table footer row) and mobile (summary block below the card list)

## 🐛 Bug Fixes

- Fixed a color regression in the Cashflow Sankey chart: after drilling into a spending category (e.g. "Rifiuti") and pressing "Indietro", the panel header reverted to the subcategory's derived gray color instead of the parent type's original color (e.g. blue for "Spese Fisse"). Navigation now correctly restores the original type color at every level

## 🔧 Improvements

- The **Overview "Sintesi Patrimoniale" card** no longer shows a redundant large number at the top. The card now reads as a clean financial statement — asset breakdown flows naturally into the fiscal impact section, with "Pat. Netto Totale" as the clear bottom-line conclusion
- Transaction list amounts in the Cashflow Sankey drill-down now use design system color tokens instead of hardcoded hex values — positive amounts in green, negative in red, both correctly adapted to all six color themes and dark mode
- Links in the Sankey transaction detail now use the `primary` color token instead of a hardcoded blue, staying consistent with the rest of the app
