import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TechnicalChart from '../../components/TechnicalChart'
import AssetChart from '../../components/AssetChart'
import { aggregateObservations } from '../../utils/chart-observations'

const series=(n,price=i=>50000+i*10)=>aggregateObservations(Array.from({length:n},(_,sequence)=>({sequence,timeMs:100000+sequence*1000,gameDay:1,gameMinute:540+Math.floor(sequence/7)*10,price:price(sequence)})),{maxCandles:Infinity})

test('RSI and MACD draw at the x coordinate of the matching price candle',()=>{
  const {container}=render(<TechnicalChart candleData={series(60)} currentPrice={50590} width={800}/>)
  const x=id=>Number(container.querySelector(`g[data-candle-id="ticks:1:${id}"]`).dataset.x)
  const firstX=key=>Number(screen.getByTestId(`indicator-${key}`).getAttribute('d').trim().match(/^M([^,]+)/)[1])
  expect(firstX('rsi')).toBeCloseTo(x(14),10);expect(firstX('macd')).toBeCloseTo(x(33),10)
})
test('keyboard pin survives new observations and latest tracking is explicit',()=>{
  const {container,rerender}=render(<TechnicalChart candleData={series(80)} currentPrice={50790} width={800}/>)
  const svg=container.querySelector('svg');fireEvent.keyDown(svg,{key:'Home'});fireEvent.keyDown(svg,{key:'ArrowRight'})
  expect(screen.getByTestId('candle-readout')).toHaveAttribute('data-candle-id','ticks:1:1')
  rerender(<TechnicalChart candleData={series(82)} currentPrice={50810} width={800}/>)
  expect(screen.getByTestId('candle-readout')).toHaveAttribute('data-candle-id','ticks:1:1')
  expect(container.querySelector('[data-ohlc="close"]')).toHaveAttribute('data-value','50010')
  fireEvent.click(screen.getByRole('button',{name:'최신 따라가기'}))
  expect(screen.getByTestId('candle-readout')).toHaveAttribute('data-candle-id','ticks:1:81')
})
test('flat zero prices render finite paths and current value zero',()=>{
  const {container}=render(<TechnicalChart candleData={series(60,()=>0)} currentPrice={0} width={320}/>)
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
  expect(screen.getByTestId('current-price-marker')).toHaveAttribute('data-value','0')
  expect(screen.getByTestId('indicator-rsi').getAttribute('d')).toContain('M')
})
test('a single valid SMA sample is a visible point instead of an invisible move command',()=>{
  const {container}=render(<TechnicalChart candleData={series(60)} currentPrice={50590} width={800}/>)
  fireEvent.click(screen.getByRole('button',{name:'MA 60'}))
  expect(container.querySelector('[data-indicator="sma60"] circle')).not.toBeNull()
})
test('zero recorded assets are never substituted with initial capital',()=>{
  render(<AssetChart assetHistory={[{timestamp:1000,value:100000000},{timestamp:2000,value:0}]} onClose={()=>{}}/>)
  expect(screen.getByTestId('last-recorded-asset')).toHaveAttribute('data-value','0')
  expect(screen.getByTestId('recorded-asset-return')).toHaveTextContent('-100.00%')
  expect(screen.getByText('마지막 기록 자산')).toBeVisible()
})
