# Session Notes — Composizione Mensile per Strumento (Storico)

## Obiettivo
Nuova sezione nella pagina Storico (`/dashboard/history`) che permette di:
1. Selezionare un mese preciso e vedere il valore di ogni singolo strumento del patrimonio in quel mese.
2. Selezionare un sottoinsieme di strumenti e vederne la somma nel mese scelto.
3. Vedere l'andamento nel tempo della somma degli strumenti selezionati su tutti i mesi disponibili.

## Scoperta chiave
I dati esistono già: `MonthlySnapshot.byAsset` (`types/assets.ts`) contiene per ogni mese
`{ assetId, ticker, name, quantity, price, totalValue }`, con `totalValue` congelato tramite
`calculateAssetValue()` al momento dello snapshot. Tutte le regole di valore (EUR, GBp, immobili al
netto del debito, quantity×prezzo) sono già applicate. Feature di sola lettura/visualizzazione.

## Decisioni
- Grafico andamento somma asset selezionati: **incluso**.
- Selezione di default: **nessun asset selezionato**.

## File toccati
- [x] `SESSION_NOTES.md` (questo file)
- [x] `lib/utils/snapshotAssetBreakdown.ts` (nuovo — layer puro)
- [x] `__tests__/snapshotAssetBreakdown.test.ts` (nuovo — test)
- [x] `components/history/MonthlyAssetBreakdownSection.tsx` (nuovo — componente)
- [x] `app/dashboard/history/page.tsx` (wiring nuova sezione)
- [x] `CLAUDE.md` (aggiornamento finale)

## Verifica
- `npx vitest run __tests__/snapshotAssetBreakdown.test.ts` → 5/5 passati.
- `npx vitest run` (intera suite) → 697/697 passati.
- `npx tsc --noEmit` → nessun errore.
- ESLint sui file nuovi → pulito (gli errori su `page.tsx`, es. `loadData` hoisting + import inutilizzati, sono preesistenti e non toccati).

## Stato
Completato. Pronto per commit/push sul branch `claude/add-monthly-history-section-Jxq4y`.
