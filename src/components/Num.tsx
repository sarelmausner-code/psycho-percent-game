import type { ReactNode } from 'react'

/** LTR isolate for every number / math expression in RTL UI. */
export function Num({ children }: { children: ReactNode }) {
  return (
    <span
      dir="ltr"
      className="num"
      style={{
        unicodeBidi: 'isolate',
        display: 'inline-block',
        fontFamily: 'var(--font-num)',
      }}
    >
      {children}
    </span>
  )
}

/** Render narrative with {params} replaced by <Num> values. */
export function Narrative({
  template,
  params,
}: {
  template: string
  params: Record<string, number>
}) {
  const parts: ReactNode[] = []
  const re = /\{(\w+)\}/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(template))) {
    if (m.index > last) parts.push(template.slice(last, m.index))
    const name = m[1]!
    const val = params[name]
    parts.push(
      <Num key={key++}>
        {formatNum(val ?? 0)}
      </Num>,
    )
    last = m.index + m[0].length
  }
  if (last < template.length) parts.push(template.slice(last))
  return <>{parts}</>
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 100) / 100)
}
