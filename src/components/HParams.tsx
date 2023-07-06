import { FC, memo, useState } from 'react'

type Props = {
  idx: string
  setter: (k: string, v: string) => void
}

export const HParamsBox: FC<Props> = memo(({ idx, setter }) => {
  const initv: { [index: string]: string } = {
    count: "100",
    lowerBound: String(1e-5),
    upperBound: String(1e-4),
  }
  const [val, setVal] = useState(initv[idx])
  const handleOnChange = (v: string) => {
    setter(idx, v)
    setVal(v)
  }

  return (
    <div className='mt-2'>
      <label htmlFor={`k_${idx}`} className='form-label'>k: {idx}</label>
      <input className='form-control mt-1 mb-3' id={`k_${idx}`} value={val} onChange={(e) => handleOnChange(e.currentTarget.value)} />
    </div>
  )
})