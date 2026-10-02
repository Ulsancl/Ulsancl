import { aggregateObservations, alignedIndicators, priceDomain, formatChartPrice, assetPlotPoints } from '../utils/chart-observations'
import { calculateRSI, calculateMACD, generateSignals } from '../game/TechnicalAnalysis'

const observations = (n, value = i => .015 + i * .000001) => Array.from({length:n},(_,sequence)=>({sequence,timeMs:100000+sequence*1000,gameDay:1+Math.floor(sequence/20),gameMinute:540+sequence%20*10,price:value(sequence)}))

describe('observed chart data',()=>{
  test('does not invent history and retains every unchanged fractional observation',()=>{
    expect(aggregateObservations([])).toEqual([])
    const source=observations(5,()=>.015), snapshot=JSON.stringify(source), result=aggregateObservations(source,{size:5})
    expect(result).toHaveLength(1); expect(result[0]).toMatchObject({open:.015,high:.015,low:.015,close:.015,count:5,complete:true,partial:false})
    expect(JSON.stringify(source)).toBe(snapshot)
  })
  test('appending observations never reanchors completed OHLC buckets',()=>{
    const source=observations(121), before=aggregateObservations(source.slice(0,120),{size:5,maxCandles:Infinity}), after=aggregateObservations(source,{size:5,maxCandles:Infinity})
    expect(after.slice(0,-1)).toEqual(before); expect(after.at(-1)).toMatchObject({id:'ticks:5:24',count:1,complete:false})
    expect(aggregateObservations(source.slice(0,120),{size:5,maxCandles:12})).toEqual(before.slice(-12))
  })
  test('initial truncated buckets and missing samples are disclosed instead of filled',()=>{
    const source=observations(12).slice(3).filter(p=>p.sequence!==7), result=aggregateObservations(source,{size:5})
    expect(result[0]).toMatchObject({id:'ticks:5:0',count:2,partial:true,complete:true})
    expect(result[1]).toMatchObject({id:'ticks:5:1',count:4,partial:true})
    expect(result[2]).toMatchObject({count:2,complete:false})
  })
  test('day buckets use supplied game days rather than real clock duration or observation count',()=>{
    const source=[{sequence:0,timeMs:5,gameDay:1,gameMinute:540,price:10},{sequence:1,timeMs:6,gameDay:3,gameMinute:950,price:12},{sequence:2,timeMs:7,gameDay:4,gameMinute:540,price:11}]
    const result=aggregateObservations(source,{kind:'days',size:3})
    expect(result[0]).toMatchObject({id:'days:3:0',open:10,close:12,count:2,complete:true,partial:true})
    expect(result[1]).toMatchObject({id:'days:3:1',open:11,count:1,complete:false})
  })
  test('the first recorded sample for each sequence wins and invalid records do not become bars',()=>{
    const source=observations(2); const result=aggregateObservations([...source,{...source[0],price:999},{sequence:4,timeMs:20,price:NaN}])
    expect(result).toHaveLength(2); expect(result[0].close).toBe(.015)
  })
  test('SMA RSI and MACD preserve their canonical candle index including warm-up',()=>{
    const candles=aggregateObservations(observations(60),{maxCandles:Infinity}), aligned=alignedIndicators(candles)
    expect(aligned.sma5.slice(0,4)).toEqual(Array(4).fill(null)); expect(aligned.sma5[4]).toBeCloseTo(candles.slice(0,5).reduce((s,c)=>s+c.close,0)/5,12)
    expect(aligned.rsi.slice(0,14)).toEqual(Array(14).fill(null)); expect(aligned.rsi[14]).toBe(100)
    expect(aligned.macd.slice(0,33)).toEqual(Array(33).fill(null)); expect(aligned.macd[33]).not.toBeNull()
    for(const values of Object.values(aligned))expect(values).toHaveLength(60)
  })
  test('flat gain-only and loss-only RSI have explicit mathematical endpoints',()=>{
    expect(calculateRSI(Array(60).fill(12))).toEqual(Array(46).fill(50))
    expect(calculateRSI(Array.from({length:60},(_,i)=>i+1))).toEqual(Array(46).fill(100))
    expect(calculateRSI(Array.from({length:60},(_,i)=>100-i))).toEqual(Array(46).fill(0))
    expect(generateSignals(Array(60).fill(12))).toEqual([])
  })
  test('MACD starts at its first valid 34th sample and flat data remains zero',()=>{
    expect(calculateMACD(Array(33).fill(5))).toBeNull()
    expect(calculateMACD(Array(34).fill(5))).toEqual({macdLine:[0],signalLine:[0],histogram:[0]})
  })
  test('price labels distinguish adjacent fractional and large prices, and constant domains remain finite',()=>{
    expect(new Set([49900,50000,50100].map(p=>formatChartPrice(p))).size).toBe(3)
    expect(new Set([.013,.015,.017].map(p=>formatChartPrice(p))).size).toBe(3)
    expect(formatChartPrice(.000000001)).not.toBe('0')
    for(const p of [0,.015,50000]){const domain=priceDomain([p,p]);expect(domain.max).toBeGreaterThan(domain.min);expect(Number.isFinite((p-domain.min)/(domain.max-domain.min))).toBe(true)}
  })
  test('asset x coordinates use actual elapsed timestamps and preserve zero',()=>{
    const history=[{value:100,timestamp:1000},{value:0,timestamp:2000},{value:50,timestamp:11000}], {points}=assetPlotPoints(history)
    expect(points[1].value).toBe(0)
    expect((points[1].x-points[0].x)/(points[2].x-points[0].x)).toBeCloseTo(.1,12)
    expect(assetPlotPoints([{value:0,timestamp:1000}]).points[0]).toMatchObject({value:0,x:300})
  })
})
