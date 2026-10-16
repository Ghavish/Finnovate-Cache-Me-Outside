import { animate, useMotionValue, useMotionValueEvent } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

// Counts a number up to its new value whenever it changes. format() turns the number into text.
// Screen readers and reduced-motion users get the final value straight away.
export default function CountUp({ value, format }) {
  const motionValue = useMotionValue(0)
  const [shown, setShown] = useState(0)
  const reduced = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useMotionValueEvent(motionValue, 'change', (latest) => setShown(latest))

  useEffect(() => {
    if (reduced.current) {
      motionValue.jump(value)
      return undefined
    }
    const controls = animate(motionValue, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [value, motionValue])

  return (
    <>
      <span aria-hidden="true">{format(Math.round(shown))}</span>
      <span className="visually-hidden">{format(value)}</span>
    </>
  )
}
