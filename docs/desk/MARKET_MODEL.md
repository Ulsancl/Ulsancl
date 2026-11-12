# MARKET DESK: market and accounting contract

The v2 desk is a synthetic investment simulator. No market-data subscription, cash deposit, withdrawal, brokerage order or investment payout exists. Practice and public seasons use the same dependency-free TypeScript core in `functions/src/desk/{model,market,broker}.ts`; the web build imports it directly. Old `/classic` accounts and scores are isolated.

## Instruments and time

Eight underlyings span stocks, ETFs, government-bond exposure, gold, crypto and foreign exchange. Three cash-settled futures and eighteen European options bring the total to 29. All accounting is KRW. Stocks/ETFs trade whole units, gold uses 1g, BTC uses 0.001 BTC and USD uses 1,000 USD per unit. Index derivatives have multiplier 10; other futures use multiplier 1. Instrument details display the multiplier and units.

One tick is a modeled trading minute, with 390 minutes per day and 252 trading days per year. This is a shared simplified clock, including crypto/FX; there are no actual exchange holidays or overnight sessions. Practice starts at tick 390, allowing inspection of the preceding day before investing. Practice supports minute/day acceleration and six campaigns, from one day to three years. Public seasons use server wall time (1, 5, 10 or 60 actual seconds per market minute), have a fixed end, and do not allow client time acceleration or resetting an account.

HMAC-SHA-256 derives domain-separated Gaussian draws from the private 256-bit public-season seed; a bounded node cache keeps calculations inexpensive. A seeded Brownian bridge supplies a consistent path at arbitrary minutes, correlated by asset beta with idiosyncratic noise, annual volatility, drift and scenario shocks. Historical OHLC never includes future ticks. Public clients receive current quotes and past candles, never the seed. Prices are bounded for numerical safety. This is an educational stochastic model, not a prediction or a recreation of a real exchange.

## Cash, equity, fills and risk

- Cash equity = cash + signed spot/option market values + unrealized futures P&L. Short proceeds are offset by the liability; they are not profit.
- Market orders use an adverse half-spread plus size impact (up to 100 bps). Fee = ceiling of executed notional × fee bps, minimum 1 KRW. Executed quantity is bounded by modeled daily liquidity / (price × multiplier × 390). Market-order remainder is canceled; limit/stop remainder can stay until the next day boundary.
- Limits execute only at or better than the limit including impact. Stops become market orders once triggered and remain triggered after partial fills. Prices can gap; a stop is not a guaranteed exit price. Orders expire at the day boundary, before execution on that boundary. Pending orders reserve buying power. Reduce-only cannot increase or reverse a position.
- Long spot/option purchases require cash. Short spot reserves 150% of current notional from cash (proceeds included), with net equity maintenance of 25% of current short notional. Borrow cost is 3% annualized, charged each modeled day.
- Futures move only fees and realized P&L in cash, never the full notional. Initial margin is 20%, maintenance 12%. Futures fair value uses spot and continuous carry. There is no exchange-style daily variation-margin transfer, funding-rate feed or physical delivery.
- Uncovered short-option reserve per unit = premium + max(20% × underlying − out-of-money amount, 10% × underlying). Maintenance uses 80% of that reserve net of option liabilities. Covered calls allocate underlying collateral once. Same-expiry/right/underlying long options offset one short each, reserving the positive strike gap. This conservative model is not a real broker's portfolio-margin system.
- Basket orders have 2–4 distinct instruments, market legs only, atomic combined risk validation. Defined-risk spread margin is evaluated on the resulting portfolio, not temporary individual legs. Unwinding a protective leg can require extra collateral.
- When equity falls below maintenance or cash becomes negative, all positions are liquidated with spread/impact and fees, ignoring normal liquidity capacity to guarantee a bounded emergency close. Negative residual wealth is retained and the account becomes insolvent; there is no free recapitalization.
- Exposure additions are capped at 10× initial capital; positions at 1,000,000 units; pending orders at 32. Catch-up does at most 4,000 risk steps per request. Clients must finish catching up before trading. Long-only, order-free accounts may skip to daily boundaries because they have no margin exposure.

## Distributions and options

Every 21 modeled days, each dividend-bearing asset pays annual yield / 12. Its price receives a corresponding discrete ex-dividend adjustment. Longs receive distributions; shorts pay them. GBM drift is before those distributions. The continuous dividend yield in option/futures valuation approximates these discrete payments.

Options use Black–Scholes with 3% rate and the instrument's annual volatility/dividend assumption. Greeks show theoretical delta, gamma, theta per trading day and vega per one volatility percentage point. They are theoretical sensitivities, not guaranteed changes. Contracts expire at market days 20, 60 or 252, measured from the market's origin, not from purchase. A later campaign start therefore has a shorter remaining maturity. Expired contracts cannot be traded; they remain visible for inspection.

European options settle intrinsic value in cash once at expiry. Futures settle their final marked P&L once. Covered calls are cash-settled, so sufficient liquidity is needed for payment. Early exercise, American options, real order books, taxes, corporate actions, dynamic borrow availability and live implied-volatility surfaces are outside this model. Strategy payoff charts assume current mid-price entry and exclude costs/distributions; intraperiod marks differ.

## Performance and progression

Equity is recorded daily and at entry. Maximum drawdown is explicitly **daily sampled**, not tick-by-tick. Recent 1/5/20-day return compares current equity to the most recent daily observation at or before the requested starting minute. Missing history yields no result. Since-entry returns use each account's original 10,000,000 KRW; differing entry times must be considered. Costs are included. No deposits mean a simple equity ratio is sufficient; this is not an annualized or money-weighted return.

Campaign medals are awarded only at completion for diversification/trading activity, target return and risk constraints. Practice results and imports remain local and unranked. Results retain up to 12 prior campaign summaries, 250 fills and 367 equity points. This is bounded game history, not an unlimited audit ledger.
