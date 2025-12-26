import React, { memo } from 'react'
import { PendingOrders } from './OrderManager'

const OrdersSection = memo(function OrdersSection({
  pendingOrders,
  stocks,
  onCancelOrder
}) {
  if (pendingOrders.length === 0) {
    return null
  }

  return (
    <section className="orders-section">
      <PendingOrders orders={pendingOrders} stocks={stocks} onCancelOrder={onCancelOrder} />
    </section>
  )
})

export default OrdersSection
