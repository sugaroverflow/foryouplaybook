import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const require = createRequire(import.meta.url)

function font(pkgPath: string): Buffer {
  return readFileSync(require.resolve(pkgPath))
}

const FONTS = [
  { name: 'Archivo', data: font('@fontsource/archivo/files/archivo-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Archivo', data: font('@fontsource/archivo/files/archivo-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'IBM Plex Mono', data: font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'IBM Plex Mono', data: font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
]

export const GRADE_COLOR: Record<string, string> = {
  A: '#0c6434',
  B: '#15803d',
  C: '#a16207',
  D: '#c2410c',
  F: '#c22a2a',
}

const GRADE_PERCENT: Record<string, number> = { A: 100, B: 75, C: 50, D: 25, F: 5 }
const GRADE_POINTS: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 }

export type FitValue = { grade: string; confidence: string }

export function overallGrade(fit: Record<string, FitValue>): string | null {
  const points = Object.values(fit)
    .map((v) => GRADE_POINTS[v.grade])
    .filter((n) => n !== undefined)
  if (points.length === 0) return null
  const avg = points.reduce((a, b) => a + b, 0) / points.length
  if (avg >= 3.5) return 'A'
  if (avg >= 2.5) return 'B'
  if (avg >= 1.5) return 'C'
  if (avg >= 0.5) return 'D'
  return 'F'
}

// Minimal element helper for satori's object tree (no JSX in this project).
type El = { type: string; props: Record<string, unknown> }
function el(type: string, style: Record<string, unknown>, children?: (El | string)[] | string, extra?: Record<string, unknown>): El {
  return { type, props: { style, children, ...extra } }
}

async function fetchAvatarDataUri(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url.replace('_normal', '_400x400'))
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get('content-type') || 'image/jpeg'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export type CardInput = {
  username: string
  displayName: string
  avatarUrl: string | null
  archetype: string
  confidence: string
  postCount: number
  fit: Record<string, FitValue>
}

const INK = '#050505'
const MUTED = 'rgba(5, 5, 5, 0.7)'

function gradeTile(dim: string, val: FitValue): El {
  const color = GRADE_COLOR[val.grade] || '#888'
  return el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      border: `2px solid ${color}`,
      borderRadius: 14,
      padding: '16px 18px',
      backgroundColor: '#ffffff',
      boxShadow: `4px 4px 0 ${color}`,
    },
    [
      el('div', { display: 'flex', fontFamily: 'IBM Plex Mono', fontSize: 16, fontWeight: 600, letterSpacing: 1, color: MUTED }, dim.toUpperCase()),
      el('div', { display: 'flex', fontFamily: 'Archivo', fontSize: 58, fontWeight: 700, color, marginTop: 2, lineHeight: 1 }, val.grade),
      el('div', { display: 'flex', width: '100%', height: 9, borderRadius: 5, backgroundColor: 'rgba(5,5,5,0.15)', marginTop: 12 }, [
        el('div', { display: 'flex', width: `${GRADE_PERCENT[val.grade] ?? 0}%`, height: 9, borderRadius: 5, backgroundColor: color }),
      ]),
      el('div', { display: 'flex', fontFamily: 'IBM Plex Mono', fontSize: 13, color: MUTED, marginTop: 10 }, val.confidence),
    ]
  )
}

export async function generateCardPng(input: CardInput): Promise<Buffer> {
  const avatar = await fetchAvatarDataUri(input.avatarUrl)
  const overall = overallGrade(input.fit)
  const overallColor = (overall && GRADE_COLOR[overall]) || '#888'

  const avatarEl = avatar
    ? el('img', { width: 120, height: 120, borderRadius: 60, border: `2px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }, undefined, { src: avatar, width: 120, height: 120 })
    : el(
        'div',
        { display: 'flex', width: 120, height: 120, borderRadius: 60, border: `2px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}`, backgroundColor: '#1d9bf0', color: '#ffffff', alignItems: 'center', justifyContent: 'center', fontFamily: 'Archivo', fontWeight: 700, fontSize: 52 },
        (input.displayName[0] || '?').toUpperCase()
      )

  const tree = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      padding: '44px 52px',
      fontFamily: 'Archivo',
      position: 'relative',
    },
    [
      // Identity strip: avatar + handle/meta, overall grade stamped on the right
      el('div', { display: 'flex', alignItems: 'center', width: '100%' }, [
        avatarEl,
        el('div', { display: 'flex', flexDirection: 'column', marginLeft: 28, flex: 1 }, [
          el('div', { display: 'flex', fontFamily: 'IBM Plex Mono', fontWeight: 600, fontSize: 34, color: INK }, `@${input.username}`),
          el('div', { display: 'flex', fontFamily: 'IBM Plex Mono', fontSize: 18, letterSpacing: 2, color: MUTED, marginTop: 8 }, `${input.postCount} POSTS STUDIED · ${input.confidence.toUpperCase()} CONFIDENCE`),
        ]),
        ...(overall
          ? [
              el(
                'div',
                { display: 'flex', flexDirection: 'column', alignItems: 'center', border: `4px solid ${overallColor}`, borderRadius: 16, padding: '14px 26px 16px', boxShadow: `5px 5px 0 ${overallColor}`, transform: 'rotate(5deg)', backgroundColor: '#ffffff' },
                [
                  el('div', { display: 'flex', fontFamily: 'Archivo', fontWeight: 700, fontSize: 56, lineHeight: 1, color: overallColor }, overall),
                  el('div', { display: 'flex', fontFamily: 'IBM Plex Mono', fontSize: 14, letterSpacing: 3, color: overallColor, marginTop: 6 }, 'OVERALL'),
                ]
              ),
            ]
          : []),
      ]),
      // Archetype
      el('div', { display: 'flex', fontFamily: 'Archivo', fontWeight: 700, fontSize: 74, letterSpacing: -1, color: INK, marginTop: 40, lineHeight: 1.05 }, input.archetype),
      // Grade rail
      el('div', { display: 'flex', width: '100%', marginTop: 44, gap: 18 }, Object.entries(input.fit).slice(0, 5).map(([dim, val]) => gradeTile(dim, val))),
      // Wordmark
      el('div', { display: 'flex', position: 'absolute', bottom: 22, right: 52, fontFamily: 'IBM Plex Mono', fontSize: 15, letterSpacing: 2, color: MUTED }, 'FORYOUPLAYBOOK.COM'),
    ]
  )

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: FONTS })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  return Buffer.from(png)
}
