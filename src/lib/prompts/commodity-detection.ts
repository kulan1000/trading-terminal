import { ALL_ASSETS } from "@/lib/instruments";

export const COMMODITY_DETECTION = `
═══════════════════════════════════════
INSTRUMENT DETECTION — EXPANDED SCOPE
═══════════════════════════════════════

CANONICAL ASSETS (the ONLY valid "asset" values):
${ALL_ASSETS.join(", ")}

Detect direct AND indirect references, then map to the canonical asset:

GOLD: gold, XAU, XAUUSD, GC, GLD, GDX, GDXJ, AU, guld, yellow metal, miners, gold miners, gold stocks, precious metals, NUGT, DUST, HUI, JNUG, NEM, AEM, Barrick, Newmont, Agnico
SILVER: silver, XAG, XAGUSD, SI, SLV, AG, silver miners, PAAS, HL, WPM, First Majestic
OIL: oil, crude, WTI, Brent, CL, USO, UCO, SCO, olja, energy, petroleum, OPEC, UKOil

INDEX FUTURES (map micros to the full-size canonical):
ES: ES, MES, S&P futures, "the S&P" when trading futures fills
NQ: NQ, MNQ, Nasdaq futures
YM: YM, MYM, Dow futures
RTY: RTY, M2K, Russell futures

INDICES: SPX (S&P 500 cash index), NDX (Nasdaq 100 cash index), VIX (volatility index, "vol", "the vix")

ETFs: SPY, QQQ, IWM, DIA, SMH (semis basket, "the semis")

EQUITIES: NVDA (Nvidia), TSLA (Tesla), AAPL (Apple), MSFT (Microsoft), AMZN (Amazon), META (Facebook/Meta), GOOGL (Google/Alphabet), AMD, PLTR (Palantir), COIN (Coinbase), MSTR (MicroStrategy/Strategy), HOOD (Robinhood)

LEVERAGED/INVERSE MAPPING (classify under the underlying; LONG an inverse product = BEARISH the underlying):
- TQQQ (3x long) → QQQ bullish · SQQQ (3x short) → QQQ bearish
- SPXL/UPRO → SPY bullish · SPXU/SDS → SPY bearish
- SOXL → SMH bullish · SOXS → SMH bearish
- UVIX/UVXY/VXX → VIX bullish · SVIX/SVXY → VIX bearish
- UCO → Oil bullish · SCO → Oil bearish · NUGT/JNUG → Gold bullish · DUST → Gold bearish · AGQ → Silver bullish · ZSL → Silver bearish

OPTIONS: calls = bullish exposure, puts = bearish exposure on the UNDERLYING ticker. "NVDA 190C" = NVDA bullish. Strike prices are NOT target_price (only explicit price targets are).

NOT TRACKED → has_signal: false:
- Crypto: BTC, ETH, SOL, DOGE, bitcoin, ethereum, any coin/token
- Bonds/rates (TLT, ZB, 10Y), FX pairs (EURUSD, DXY alone)
- Small-caps / tickers outside the canonical list — do NOT force them into a similar canonical asset

INDIRECT: "metals" → Gold+Silver, "commodities" → Gold+Silver+Oil, "energy ripping" → Oil, "miners lagging" → Gold/Silver, "precious metals"/"PM" → Gold+Silver, "central banks buying" → Gold (bullish), "tech ripping" → NQ or QQQ (pick from context, default QQQ), "the market"/"stocks dumping" in an equities channel → SPX

CHANNEL CONTEXT: In #gold-commodities, ambiguous "it"/"this"/"the market" likely = Gold/Silver/Oil. In #equities-stocks, ambiguous references likely = ES/SPX/NQ or the stock under discussion. In #sang-daily-updates, expect multi-asset macro rundowns — emit one signal per asset mentioned with a stance.`;
