// Instrument registry — THE single source of truth for what the terminal
// tracks. The classifier schema enum, sanitize whitelist, prompt asset lists,
// pre-filter keywords, Yahoo price feed and market-hours routing all derive
// from this table. Adding an instrument here is the ONLY code change needed —
// plus widening the `signals_asset_check` DB constraint (see docs/RUNBOOK.md).
//
// Universe = empirically mined from the FoftyTrades channels (ticker
// frequencies in #equities-stocks + #traders-lounge, 2026-07-10 sweep):
// ES 26 · SPX 20 · QQQ 17 · VIX 16 · NVDA 10 · NQ 10 · SPY 8 · rest ≤5.
// Crypto is deliberately NOT tracked (BTC/ETH talk → has_signal: false).

export type AssetClass = "commodity" | "index_future" | "index" | "etf" | "equity";

// Which trading calendar an instrument follows:
//   comex          — metals/oil futures: Sun 18:00 → Fri 17:00 ET, daily 17–18 break
//   index_futures  — CME equity futures (ES/NQ/YM/RTY): same Globex schedule as comex
//   equity_rth     — US stocks/ETFs/indices: RTH 9:30–16:00 ET (ext. 4:00–20:00)
export type HoursKind = "comex" | "index_futures" | "equity_rth";

export interface Instrument {
  readonly ticker: string;       // canonical `signals.asset` value
  readonly displayName: string;
  readonly displayPair: string;  // subtitle shown next to the ticker in UI
  readonly assetClass: AssetClass;
  readonly hoursKind: HoursKind;
  readonly yahooSymbol: string;  // price feed symbol
}

export const INSTRUMENTS = [
  // — Commodities (original trio — ticker names are load-bearing: all signal
  //   history, scoring and sentiment snapshots key on these exact strings) —
  { ticker: "Gold",   displayName: "Gold",   displayPair: "XAUUSD", assetClass: "commodity", hoursKind: "comex", yahooSymbol: "GC=F" },
  { ticker: "Silver", displayName: "Silver", displayPair: "XAGUSD", assetClass: "commodity", hoursKind: "comex", yahooSymbol: "SI=F" },
  { ticker: "Oil",    displayName: "Oil",    displayPair: "WTI",    assetClass: "commodity", hoursKind: "comex", yahooSymbol: "CL=F" },

  // — Index futures (trade nearly 24/5 — evening entries are VALID) —
  { ticker: "ES",  displayName: "S&P 500 futures",  displayPair: "E-mini S&P",     assetClass: "index_future", hoursKind: "index_futures", yahooSymbol: "ES=F" },
  { ticker: "NQ",  displayName: "Nasdaq futures",   displayPair: "E-mini Nasdaq",  assetClass: "index_future", hoursKind: "index_futures", yahooSymbol: "NQ=F" },
  { ticker: "YM",  displayName: "Dow futures",      displayPair: "E-mini Dow",     assetClass: "index_future", hoursKind: "index_futures", yahooSymbol: "YM=F" },
  { ticker: "RTY", displayName: "Russell futures",  displayPair: "E-mini Russell", assetClass: "index_future", hoursKind: "index_futures", yahooSymbol: "RTY=F" },

  // — Cash indices —
  { ticker: "SPX", displayName: "S&P 500",    displayPair: "Index",     assetClass: "index", hoursKind: "equity_rth", yahooSymbol: "^GSPC" },
  { ticker: "NDX", displayName: "Nasdaq 100", displayPair: "Index",     assetClass: "index", hoursKind: "equity_rth", yahooSymbol: "^NDX" },
  { ticker: "VIX", displayName: "VIX",        displayPair: "CBOE Vol",  assetClass: "index", hoursKind: "equity_rth", yahooSymbol: "^VIX" },

  // — Index/sector ETFs —
  { ticker: "SPY", displayName: "SPY", displayPair: "S&P 500 ETF",   assetClass: "etf", hoursKind: "equity_rth", yahooSymbol: "SPY" },
  { ticker: "QQQ", displayName: "QQQ", displayPair: "Nasdaq ETF",    assetClass: "etf", hoursKind: "equity_rth", yahooSymbol: "QQQ" },
  { ticker: "IWM", displayName: "IWM", displayPair: "Russell ETF",   assetClass: "etf", hoursKind: "equity_rth", yahooSymbol: "IWM" },
  { ticker: "DIA", displayName: "DIA", displayPair: "Dow ETF",       assetClass: "etf", hoursKind: "equity_rth", yahooSymbol: "DIA" },
  { ticker: "SMH", displayName: "SMH", displayPair: "Semis ETF",     assetClass: "etf", hoursKind: "equity_rth", yahooSymbol: "SMH" },

  // — Large-cap equities the community actually trades —
  { ticker: "NVDA",  displayName: "NVIDIA",        displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "NVDA" },
  { ticker: "TSLA",  displayName: "Tesla",         displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "TSLA" },
  { ticker: "AAPL",  displayName: "Apple",         displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "AAPL" },
  { ticker: "MSFT",  displayName: "Microsoft",     displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "MSFT" },
  { ticker: "AMZN",  displayName: "Amazon",        displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "AMZN" },
  { ticker: "META",  displayName: "Meta",          displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "META" },
  { ticker: "GOOGL", displayName: "Alphabet",      displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "GOOGL" },
  { ticker: "AMD",   displayName: "AMD",           displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "AMD" },
  { ticker: "PLTR",  displayName: "Palantir",      displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "PLTR" },
  { ticker: "COIN",  displayName: "Coinbase",      displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "COIN" },
  { ticker: "MSTR",  displayName: "Strategy",      displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "MSTR" },
  { ticker: "HOOD",  displayName: "Robinhood",     displayPair: "NASDAQ", assetClass: "equity", hoursKind: "equity_rth", yahooSymbol: "HOOD" },
] as const satisfies readonly Instrument[];

export type Asset = (typeof INSTRUMENTS)[number]["ticker"];

export const ALL_ASSETS: readonly Asset[] = INSTRUMENTS.map((i) => i.ticker);

export const COMMODITY_ASSETS = ["Gold", "Silver", "Oil"] as const satisfies readonly Asset[];
export type CommodityAsset = (typeof COMMODITY_ASSETS)[number];

const BY_TICKER: ReadonlyMap<string, Instrument> = new Map(
  INSTRUMENTS.map((i) => [i.ticker, i])
);

export function isKnownAsset(s: string): s is Asset {
  return BY_TICKER.has(s);
}

export function instrumentOf(asset: Asset): Instrument {
  return BY_TICKER.get(asset)!;
}

export function hoursKindOf(asset: Asset): HoursKind {
  return instrumentOf(asset).hoursKind;
}

export function assetClassOf(asset: Asset): AssetClass {
  return instrumentOf(asset).assetClass;
}
