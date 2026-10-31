import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { Meter } from '../types'

const meters = atom({ plugin: 'usage-meter', key: 'meters' } as const, [] as Meter[])

const LABELS: Record<string, string> = { five_hour: '5小時', seven_day: '每週' }
const WARN_AT = [80, 95]

function bar(percent: number): string {
  const filled = Math.min(10, Math.round(percent / 10))
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

function resetsIn(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const minutes = Math.max(0, Math.round((Date.parse(resetsAt) - now) / 60000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return `${days}天${hours}時後重置`
  return `${hours}時${minutes % 60}分後重置`
}

function color(percent: number): string {
  return percent >= 90 ? 'error' : percent >= 70 ? 'warning' : 'success'
}

const warned = new Set<string>()

async function refresh($: EngineInterface, rateLimits: SessionRateLimit[]) {
  const next = rateLimits.map(({ kind, percentUsed, resetsAt }) => ({ kind, percentUsed, resetsAt }))
  await update($, meters, () => next)

  const now = await $.clock.now()
  const status = next.map(m => `${LABELS[m.kind] ?? m.kind} ${m.percentUsed}%`).join(' · ')
  $.ui.status(status || undefined)

  for (const m of next) {
    for (const level of WARN_AT) {
      const key = `${m.kind}:${level}:${m.resetsAt ?? ''}`
      if (m.percentUsed >= level && !warned.has(key)) {
        warned.add(key)
        $.ui.toast(`${LABELS[m.kind] ?? m.kind}額度已用 ${m.percentUsed}%，${resetsIn(m.resetsAt, now)}`)
      }
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($, (await $.session.usage()).rateLimits)
    return result
  })

  on('session.measure', async ($, e, next) => {
    await refresh($, e.rateLimits)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, meters)
    if (e.props.hasSurvey || list.length === 0) return next(e)

    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" gap={2}>
        {list.map(m => (
          <Text key={m.kind}>
            <Text dimColor>{LABELS[m.kind] ?? m.kind} </Text>
            <Text color={color(m.percentUsed)}>{bar(m.percentUsed)} {m.percentUsed}%</Text>
            <Text dimColor> {resetsIn(m.resetsAt, now)}</Text>
          </Text>
        ))}
      </Box>
    )
  })
}
