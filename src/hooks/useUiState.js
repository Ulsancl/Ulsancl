import { useState } from 'react'

export const useUiState = () => {
  const [quantity, setQuantity] = useState(1)
  const [amountMode, setAmountMode] = useState(false)
  const [inputAmount, setInputAmount] = useState('')
  const [leverage, setLeverage] = useState('1x')
  const [tradeMode, setTradeMode] = useState('long')

  return {
    quantity, setQuantity,
    amountMode, setAmountMode,
    inputAmount, setInputAmount,
    leverage, setLeverage,
    tradeMode, setTradeMode
  }
}

export default useUiState
