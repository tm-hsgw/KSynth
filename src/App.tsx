import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { Chart } from './components/Chart';
import { HParamsBox } from './components/HParams';
import { INITIAL_HYPER_PARAMS } from './utils/Objective';
import { Swarm, OptimizeResult } from './utils/PSO';

type Props = {
  gtOptions: Highcharts.Options
  options: Highcharts.Options
  dataPointsStr: string
  // hParams: HParam
  ioParams: {
    alpha?: string
    mu?: string
    sigma?: string
  }[]
  isAccordionOpen: boolean,
  setAccordion: React.Dispatch<React.SetStateAction<boolean>>
  fittingResult?: OptimizeResult
  handleAddParams: () => void
  handleRemoveParams: (idx: number) => void
  handleChangeDataPoints: (input: string) => void
  handleChangeHParams: (
    key: 'count' | 'stride' | 'upperBound' | 'lowerBound',
    value: string
  ) => void
  handleChangeIOParams: (idx: number, param: 'alpha' | 'mu' | 'sigma', value: string) => void
  handleFit: () => void
}

const GaussianDist = (mu: number, sigma: number, d?: number, alpha?: number) => {
  let arr: [number, number][] = []
  sigma = Math.abs(sigma)

  const min = Math.max(mu - sigma * 4, 0)
  const max = Math.min(mu + sigma * 4, 0.001)

  if (!d) {
    d = (max - min) / 5e+2
  }

  if (!alpha) {
    alpha = 1
  }

  let x = min

  while (x < max) {
    arr.push([x, alpha * 1 / Math.sqrt(2 * Math.PI * sigma * sigma) * Math.exp(-1 * (x - mu) * (x - mu) / 2 / sigma / sigma) * d])
    x += d
  }

  return arr
}

const RevExp = (k: number, tstart: number = 0, tend: number = 78867.4) => {
  // console.log(k)
  const dt = (tend - tstart) / 200
  let arr = []
  for (let t = 0; t < tend; t += dt) {
    arr.push([t, Math.exp(-k * t)])
  }
  return arr
}

const INITIAL_OPTION: Highcharts.Options = {
  chart: {
    type: 'scatter',
    height: '60%'
  },
  title: {
    text: ''
  },
  subtitle: {
    text: ''
  },
  tooltip: {
    enabled: false
  },
  xAxis: {
    title: {
      text: 'k',
      align: 'low',
      margin: 15
    },
    min: 0,
    // max: 1,
    startOnTick: true,
    endOnTick: true,
    showLastLabel: true
  },
  yAxis: {
    title: {
      text: 'A',
      align: 'high',
      rotation: 0
    },
    // max: 1,
  },
  legend: {
    layout: 'horizontal',
    align: 'right',
    verticalAlign: 'bottom',
    x: 0,
    y: 7,
    floating: true,
    itemStyle: {
      fontWeight: 'normal'
    }
  },
  navigation: {
    buttonOptions: {
      theme: {
        // states: {
        //   hover: {
        //     fill: '#fff'
        //   },
        //   select: {
        //     fill: '#f7f8fa'
        //   }
        // }
      }
    },
    menuItemStyle: {
      fontWeight: 'normal',
      background: 'none'
    },
    menuItemHoverStyle: {
      fontWeight: 'bold',
      background: '#1784B0',
      color: '#fff'
    }
  },
  plotOptions: {
    scatter: {
      marker: {
        radius: 1.5,
        states: {
          hover: {
            enabled: false,
          }
        }
      },
      states: {
        hover: {}
      },
      // tooltip: {
      //   headerFormat: '{series.name}<br>',
      //   pointFormat: '{point.x}, {point.y}'
      // }
    }
  },
  // series: [{
  //   type: 'scatter',
  //   data: [[0, 0]]
  // }]
}

function formatTooltip(this: Highcharts.TooltipFormatterContextObject, tooltip: Highcharts.Tooltip) {
  return `${this.series.name}`
}

const Component: React.FC<Props> = ({
  gtOptions,
  options,
  dataPointsStr,
  // hParams,
  ioParams,
  isAccordionOpen,
  setAccordion,
  fittingResult,
  handleAddParams,
  handleRemoveParams,
  handleChangeDataPoints,
  handleChangeHParams,
  handleChangeIOParams,
  handleFit
}) => (
  <>
    <div className='row d-flex mt-5'>
      <div className='col-2'></div>
      <div className='col-2'>
        <label htmlFor='observation' className='for-label'>observation data</label>
        <textarea
          className='form-control mt-1'
          id='observation' rows={10}
          placeholder='delay, autocorr'
          onChange={(e) => handleChangeDataPoints(e.currentTarget.value)}
          defaultValue={dataPointsStr}
        />
      </div>
      <div className='col-7 row align-items-center'>
        {ioParams.map((params, idx) => (
          <div className='col-3 border-start border-end justify-content-center'>
            <li key={idx}>
              <div className='row justify-content-around'>
                {idx > 0 && (
                  <div className='col-2'>
                    <button type="button" className="btn btn-outline-secondary btn-round" onClick={(_) => handleRemoveParams(idx)}>ー</button>
                  </div>
                )}
                <div className='col-9'>
                  <label htmlFor={`alpha_${idx}`} className='form-label'>&alpha;<sub>{idx}</sub></label>
                  <input className='form-control mt-1 mb-3' id={`alpha_${idx}`} value={params.alpha} onChange={(e) => handleChangeIOParams(idx, 'alpha', e.currentTarget.value)} />
                  <label htmlFor={`mu_${idx}`} className='form-label'>c<sub>{idx}</sub></label>
                  <input className='form-control mt-1 mb-3' id={`mu_${idx}`} value={params.mu} onChange={(e) => handleChangeIOParams(idx, 'mu', e.currentTarget.value)} />
                  <label htmlFor={`sigma_${idx}`} className='form-label'>h<sub>{idx}</sub></label>
                  <input className='form-control mt-1 mb-3' id={`sigma_${idx}`} value={params.sigma} onChange={(e) => handleChangeIOParams(idx, 'sigma', e.currentTarget.value)} />
                </div>
              </div>
              {/* <hr /> */}
            </li>
          </div>
        ))}
        {ioParams.length < 3 && (
          <div className='col-1'>
            <button type="button" className="btn btn-outline-secondary btn-round" onClick={handleAddParams}>+</button>
          </div>
        )}
        <div className='col-3 d-flex justify-content-center'>


          <button type='button' className='btn btn-primary w-100 h-25' onClick={handleFit}>Fit</button>
        </div>
      </div>
    </div>
    <div className='row mt-5'>
      <div className='col-2'></div>
      <div className='col-8'>
        {isAccordionOpen ? (
          <>
            <a href='#' className='text-primary' onClick={(_) => setAccordion(false)} >▼ しまう</a>
            <div className='w-25'>
              {['count', 'lowerBound', 'upperBound'].map(key => {
                return (
                  <HParamsBox {...{
                    idx: key, setter: (k, v) => {
                      if (k === 'count' || k === 'lowerBound' || k === 'upperBound')
                        handleChangeHParams(k, v)
                    }
                  }} />
                )
              })}
            </div>

          </>
        ) : (
          <>
            <a href='#' className='text-primary' onClick={(_) => setAccordion(true)} >▶ 高度なオプション</a>
          </>
        )}
      </div>
    </div>
    <div className='row d-flex mt-5'>
      <div className='col-1' />
      <div className='col-5 align-self-center'>
        <Chart {...{ options: gtOptions }} />
      </div>
      <div className='col-5 align-self-center'>
        {
          fittingResult && (
            <div>
              <span className='mr-2'>{`error: ${fittingResult.error.toExponential(5)}`}</span>
            </div>
          )
        }

        <Chart {...{ options }} />
      </div>
    </div >
  </>
)

export const App = () => {
  const [gtOptions, setGtOptions] = useState(INITIAL_OPTION)
  const [options, setOptions] = useState(INITIAL_OPTION)
  const [hParams, setHParams] = useState(INITIAL_HYPER_PARAMS)
  const [ioParams, setIOParams] = useState<{ alpha?: string, mu?: string, sigma?: string }[]>([{ alpha: '1', mu: '0', sigma: '1' }])
  const [fittingResult, setFittingResult] = useState<OptimizeResult>()
  const [dataPoints, setDataPoints] = useState<{ delay: number, autocorr: number }[]>([
    { delay: 1, autocorr: 0.985649803897049 },
    { delay: 1.4, autocorr: 0.9856330397124115 },
    { delay: 1.9, autocorr: 0.9856120849739192 },
    { delay: 2.6, autocorr: 0.9855827492589708 },
    { delay: 3.6, autocorr: 0.9855408429544371 },
    { delay: 5, autocorr: 0.9854821778034598 },
    { delay: 6.9, autocorr: 0.9854025676707564 },
    { delay: 9.5, autocorr: 0.9852936402846997 },
    { delay: 13.1, autocorr: 0.9851428421561272 },
    { delay: 18.1, autocorr: 0.9849334473189608 },
    { delay: 25, autocorr: 0.9846445721792377 },
    { delay: 34.5, autocorr: 0.9842470157334632 },
    { delay: 47.6, autocorr: 0.9836991295427377 },
    { delay: 65.7, autocorr: 0.9829427425147166 },
    { delay: 90.7, autocorr: 0.9818991831223021 },
    { delay: 125.2, autocorr: 0.9804613044020595 },
    { delay: 172.8, autocorr: 0.978481690972649 },
    { delay: 238.5, autocorr: 0.9757573823048837 },
    { delay: 329.2, autocorr: 0.9720117175803034 },
    { delay: 454.4, autocorr: 0.9668702692633699 },
    { delay: 627.2, autocorr: 0.9598288509836791 },
    { delay: 865.7, autocorr: 0.9502134381831717 },
    { delay: 1194.9, autocorr: 0.9371350878365003 },
    { delay: 1649.3, autocorr: 0.919444500788444 },
    { delay: 2276.5, autocorr: 0.8956964637813781 },
    { delay: 3142.2, autocorr: 0.8641459490320731 },
    { delay: 4337.1, autocorr: 0.8228163543496572 },
    { delay: 5986.4, autocorr: 0.7697005352246119 },
    { delay: 8262.9, autocorr: 0.7031670964433353 },
    { delay: 11405.1, autocorr: 0.6226217018692941 },
    { delay: 15742.2, autocorr: 0.5293699813025288 },
    { delay: 21728.6, autocorr: 0.42740431536806794 },
    { delay: 29991.5, autocorr: 0.323557387763232 },
    { delay: 41396.6, autocorr: 0.22643033041087138 },
    { delay: 57138.8, autocorr: 0.14411399967160432 },
    { delay: 78867.4, autocorr: 0.08176584298399604 }
  ])
  const [plot1, setPlot1] = useState<{ observatin?: Highcharts.SeriesOptionsType, calc?: Highcharts.SeriesOptionsType, grid?: Highcharts.SeriesOptionsType[] }>()
  const [isAccordionOpen, setAccordion] = useState(false)

  // todo
  // const [isInit, setIsInit] = useState(false)

  const CalcFt = useCallback(
    (params: { alpha: number, mu: number, sigma: number }[]) => {
      const sumAlpha = params.reduce((sum, p) => sum + p.alpha, 0)
      params = params.map(p => ({
        ...p,
        alpha: p.alpha / sumAlpha
      }))

      const a = (c: number, h: number, x: number) => (
        1 / Math.sqrt(2 * Math.PI * h * h) * Math.exp(-1 * (x - c) * (x - c) / 2 / h / h)
      )

      const f = (t: number) => (
        [...Array(Number(hParams.k.count))]
          .map((_, i) => Number(hParams.k.lowerBound) + Number(hParams.k.stride) * i)
          .reduce((sum, k) => (
            sum
            // A_n
            + params.reduce((innerSum, param) => (
              innerSum + param.alpha * a(param.mu, param.sigma, Number(k)) * (Number(hParams.k.stride))
            ), 0)
            // exp(-k_n * t)
            * Math.exp(-k * t)
          ), 0)
      )

      return dataPoints.map(d => [d.delay, f(d.delay)])
    }
    , [dataPoints, hParams])


  useEffect(() => {
    setPlot1(p => ({
      ...p,
      grid: [...Array(31)].map((_, i) => ({
        type: 'scatter',
        name: `k = ${(i / 300000).toExponential(4)}`,
        data: RevExp(i / 300000),
        color: '#50e99160',
        marker: {
          radius: 0.5
        }
      }))
    }))
    // setIsInit(false)
  }, [])

  useEffect(() => {
    // if (isInit) {
    //   return
    // }
    let update = true
    const newSeries: Highcharts.SeriesOptionsType[] = ioParams.map(param => {
      if (!param.alpha || !param.mu || !param.sigma || isNaN(Number(param.alpha)) || isNaN(Number(param.mu)) || !Number(param.sigma)) {
        update = false
        return { type: 'scatter', data: [] }
      }
      return { type: 'scatter', data: GaussianDist(Number(param.mu), Number(param.sigma), undefined, Number(param.alpha)) }
    })

    if (update) {
      setOptions(o => ({
        ...o,
        xAxis: {
          ...o.xAxis,
          max: undefined
        },
        chart: {
          ...o.chart,
          height: '60%',
        },
        series: newSeries
      }))

      setPlot1(p => ({
        ...p,
        calc: {
          type: 'scatter',
          name: 'F(t)',
          data: CalcFt(ioParams.map(p => ({ alpha: Number(p.alpha), mu: Number(p.mu), sigma: Number(p.sigma) }))),
          color: "#0bb4ff"
        }
      }))
    }

  }, [CalcFt, ioParams])

  useEffect(() => {
    setPlot1(p => ({
      ...p,
      observatin: {
        type: 'scatter',
        name: 'g(t)',
        data: dataPoints.map(d => [d.delay, d.autocorr]),
        color: '#e60049'
      }
    }))
  }, [dataPoints])

  useEffect(() => {
    if (plot1?.grid) {
      let newSeries = plot1.grid.slice()

      if (plot1.calc) {
        newSeries.push(plot1.calc)
      }

      if (plot1.observatin) {
        newSeries.push(plot1.observatin)
      }

      setGtOptions(go => ({
        ...go,
        plotOptions: {
          ...go.plotOptions,
          scatter: {
            marker: {
              radius: 2.5,
              states: {
                hover: {
                  enabled: false,
                }
              }
            },
            lineWidth: 1,
            states: {
              hover: {}
            },
          }
        },
        tooltip: {
          enabled: true,
          formatter: formatTooltip
        },
        xAxis: {
          ...go.xAxis,
          endOnTick: false,
          min: 1.2,
          max: undefined,
          title: {
            text: 't',
            align: 'low',
            margin: 15
          },
        },
        yAxis: {
          ...go.yAxis,
          endOnTick: false,
          title: {
            text: 'g(t)',
            align: 'middle',
            rotation: 0
            // margin: 15
          },
        },
        legend: {
          enabled: false
        },
        series: newSeries
      }))
    }
  }, [plot1])

  useEffect(() => {
    setHParams(p => ({
      k: {
        ...p.k,
        stride: String((Number(hParams.k.upperBound) - Number(hParams.k.lowerBound)) / Number(hParams.k.count)),
      }
    }))
  }, [hParams.k.lowerBound, hParams.k.upperBound, hParams.k.count])

  const Residual = useCallback((params: { alpha: number, mu: number, sigma: number }[]) => {
    const sumAlpha = params.reduce((sum, p) => sum + p.alpha, 0)
    params = params.map(p => ({
      ...p,
      alpha: p.alpha / sumAlpha
    }))

    const a = (c: number, h: number, x: number) => (
      1 / Math.sqrt(2 * Math.PI * h * h) * Math.exp(-1 * (x - c) * (x - c) / 2 / h / h)
    )

    const f = (t: number) => (
      // todo: 刻み数state化
      [...Array(101)]
        .map((_, i) => Number(hParams.k.lowerBound) + Number(hParams.k.stride) * i)
        .reduce((sum, k) => (
          sum
          // A_n
          + params.reduce((innerSum, param) => (
            innerSum + param.alpha * a(param.mu, param.sigma, Number(k)) * Number(hParams.k.stride)
          ), 0)
          // exp(-k_n * t)
          * Math.exp(-k * t)
        ), 0)
    )

    return dataPoints
      .reduce((sum, point) => (
        sum + Math.abs(f(point.delay) - point.autocorr)
      ), 0)
  }, [dataPoints, hParams.k.lowerBound, hParams.k.stride])

  const ObjectiveFunc = useCallback((candidate: number[]) => {
    const n = candidate.length
    let props = []
    for (let i = 0; i < n; i += 3) {
      props.push({ alpha: candidate[i], mu: candidate[i + 1], sigma: candidate[i + 2] })
    }

    return Residual(props)
  }, [Residual])

  const handleChangeDataPoints = useCallback((input: string) => {
    const newDataPoints = input
      .replace('\r\n', '\n')
      .replace('\r', '\n')
      .split('\n')
      .map(data => {
        data = data.replace(' ', '')
        if (data.indexOf(',') === -1) {
          return undefined
        }

        const arr = data.split(',')
        if (arr.length < 2) {
          return undefined
        }

        const delay = Number(arr[0])
        const autocorr = Number(arr[1])

        if (!delay || !autocorr) {
          return undefined
        }

        return { delay, autocorr }
      })
      .filter<{ delay: number, autocorr: number }>((x): x is { delay: number, autocorr: number } => typeof (x) === 'object')

    if (newDataPoints.length > 0) {
      setDataPoints(newDataPoints)
    }
  }, [])

  const handleChangeIOParams = useCallback((idx: number, param: 'alpha' | 'mu' | 'sigma', value: string) => {
    let newParams = ioParams.slice()

    newParams[idx][param] = value
    setIOParams(newParams)
  }, [ioParams])

  const handleAddParams = useCallback(() => {
    let newParams = ioParams.slice()
    newParams.push(Object.assign({}, ioParams[ioParams.length - 1]))

    setIOParams(newParams)
  }, [ioParams])

  const handleRemoveParams = useCallback((idx: number) => {
    let newParams = ioParams.slice().filter((_, i) => i !== idx)

    setIOParams(newParams)
  }, [ioParams])

  const handleFit = useCallback(() => {
    const swarm = Swarm(ioParams.length * 3)
    const result = swarm.fit(ObjectiveFunc, 100)

    const n = result.value.length
    let newParams = []
    for (let i = 0; i < n; i += 3) {
      newParams.push({ alpha: result.value[i], mu: result.value[i + 1].toExponential(4), sigma: result.value[i + 2].toExponential(4) })
    }

    // console.log(newParams)
    setFittingResult(result)

    const sumAlpha = newParams.reduce((sum, p) => sum + p.alpha, 0)
    newParams = newParams.map(p => ({
      ...p,
      alpha: (p.alpha / sumAlpha).toFixed(4)
    }))
    setIOParams(newParams)
  }, [ObjectiveFunc, ioParams.length])

  const handleChangeHParams = useCallback((
    key: 'count' | 'stride' | 'upperBound' | 'lowerBound',
    value: string
  ) => {
    setHParams(p => ({
      k: {
        ...p.k,
        [key]: value
      }
    }))

  }, [])

  return <Component {...{
    gtOptions,
    options,
    dataPointsStr: dataPoints.map(d => `${d.delay}, ${d.autocorr.toFixed(4)}`).join('\n'),
    hParams,
    ioParams,
    isAccordionOpen,
    setAccordion,
    fittingResult,
    handleAddParams,
    handleRemoveParams,
    handleChangeDataPoints,
    handleChangeHParams,
    handleChangeIOParams,
    handleFit
  }} />
}