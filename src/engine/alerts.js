/**
 * Alert evaluation logic shared by game systems.
 */

export const checkAlerts = (alerts, stocks, portfolio) => {
    const triggered = []

    alerts.forEach(alert => {
        if (alert.triggered) return

        const stock = stocks.find(s => s.id === alert.stockId)
        if (!stock) return

        let shouldTrigger = false

        switch (alert.type) {
            case 'price_above':
                shouldTrigger = stock.price >= alert.targetValue
                break
            case 'price_below':
                shouldTrigger = stock.price <= alert.targetValue
                break
            case 'profit_rate': {
                const holding = portfolio?.[alert.stockId]
                if (holding) {
                    const avgPrice = holding.totalCost / holding.quantity
                    const profitRate = ((stock.price - avgPrice) / avgPrice) * 100
                    shouldTrigger = profitRate >= alert.targetValue
                }
                break
            }
            case 'loss_rate': {
                const lossHolding = portfolio?.[alert.stockId]
                if (lossHolding) {
                    const avgPriceLoss = lossHolding.totalCost / lossHolding.quantity
                    const lossRate = ((avgPriceLoss - stock.price) / avgPriceLoss) * 100
                    shouldTrigger = lossRate >= alert.targetValue
                }
                break
            }
            default:
                break
        }

        if (shouldTrigger) {
            triggered.push({ ...alert, triggered: true })
        }
    })

    return triggered
}

