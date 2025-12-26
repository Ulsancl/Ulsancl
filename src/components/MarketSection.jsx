import React, { memo } from 'react'
import StockListItem from './StockListItem'

const MarketSection = memo(function MarketSection({
  tradeMode,
  amountMode,
  quantity,
  inputAmount,
  canShortSell,
  shortSellingMinLevel,
  isInitialized,
  filteredStocks,
  portfolio,
  shortPositions,
  priceChanges,
  watchlist,
  cash,
  onTradeModeChange,
  onAmountModeChange,
  onQuantityChange,
  onInputAmountChange,
  onToggleWatchlist,
  onShowChart,
  onBuy,
  onSellAll,
  onShortSell,
  onCoverShort,
  onOpenOrderManager,
  getEstimatedQuantity,
  getProductTypeLabel
}) {
  return (
    <>
      <section className="trade-mode-section">
        <div className="trade-mode-toggle">
          <button
            className={`mode-btn ${tradeMode === 'long' ? 'active' : ''}`}
            onClick={() => onTradeModeChange('long')}
          >
            📈 롱
          </button>
          <button
            className={`mode-btn short ${tradeMode === 'short' ? 'active' : ''} ${!canShortSell ? 'disabled' : ''}`}
            onClick={() => canShortSell && onTradeModeChange('short')}
            title={!canShortSell ? `Lv.${shortSellingMinLevel} 필요` : ''}
          >
            🐻 숏
          </button>
        </div>
        <div className="trade-mode-toggle">
          <button
            className={`mode-btn ${!amountMode ? 'active' : ''}`}
            onClick={() => onAmountModeChange(false)}
          >
            수량
          </button>
          <button
            className={`mode-btn ${amountMode ? 'active' : ''}`}
            onClick={() => onAmountModeChange(true)}
          >
            금액
          </button>
        </div>
        {amountMode ? (
          <div className="amount-input-section">
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => onInputAmountChange(e.target.value)}
              placeholder="금액"
              className="amount-input"
            />
            <span className="amount-unit">원</span>
          </div>
        ) : (
          <div className="quantity-global-section">
            <button className="qty-btn" onClick={() => onQuantityChange(Math.max(1, quantity - 1))}>-</button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="quantity-input"
              min="1"
            />
            <button className="qty-btn" onClick={() => onQuantityChange(quantity + 1)}>+</button>
          </div>
        )}
      </section>

      <section className="stock-section">
        <div className="stock-list">
          {filteredStocks.map((stock, index) => {
            const holding = portfolio[stock.id]
            const shortPos = shortPositions[stock.id]
            const priceChange = priceChanges[stock.id]
            const isWatched = watchlist.includes(stock.id)
            const estimatedQty = amountMode ? getEstimatedQuantity(stock) : quantity

            return (
              <StockListItem
                key={stock.id}
                stock={stock}
                index={index}
                isInitialized={isInitialized}
                holding={holding}
                shortPosition={shortPos}
                priceChange={priceChange}
                isWatched={isWatched}
                estimatedQty={estimatedQty}
                tradeMode={tradeMode}
                cash={cash}
                onToggleWatchlist={onToggleWatchlist}
                onShowChart={onShowChart}
                onBuy={onBuy}
                onSellAll={onSellAll}
                onShortSell={onShortSell}
                onCoverShort={onCoverShort}
                onOpenOrderManager={onOpenOrderManager}
                getProductTypeLabel={getProductTypeLabel}
              />
            )
          })}
        </div>
      </section>
    </>
  )
})

export default MarketSection
