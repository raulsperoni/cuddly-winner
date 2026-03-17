import { useMemo } from 'react'
import { diff_match_patch } from 'diff-match-patch'

const dmp = new diff_match_patch()

function wordDiff(text1: string, text2: string): [number, string][] {
  const tokens: string[] = []
  const tokenToChar = new Map<string, string>()
  let charIndex = 0xe000

  const tokenize = (text: string): string => {
    const words = text.match(/\S+|\s+/g) ?? []
    return words
      .map((w) => {
        if (!tokenToChar.has(w)) {
          const ch = String.fromCharCode(charIndex)
          tokenToChar.set(w, ch)
          tokens[charIndex - 0xe000] = w
          charIndex++
        }
        return tokenToChar.get(w)!
      })
      .join('')
  }

  const chars1 = tokenize(text1)
  const chars2 = tokenize(text2)
  const diffs = dmp.diff_main(chars1, chars2, false)
  dmp.diff_cleanupSemantic(diffs)

  return diffs.map(
    ([op, chars]) =>
      [
        op,
        chars
          .split('')
          .map((c) => tokens[c.charCodeAt(0) - 0xe000] ?? c)
          .join(''),
      ] as [number, string],
  )
}

interface Props {
  original: string
  modified: string
}

export function DiffView({ original, modified }: Props) {
  const diffs = useMemo(() => wordDiff(original, modified), [original, modified])

  return (
    <div className="prose-font text-[15px] leading-relaxed text-zinc-300">
      {diffs.map(([op, text], i) => {
        if (op === 1) {
          return (
            <span key={i} className="bg-green-900/50 text-green-300 rounded-sm">
              {text}
            </span>
          )
        }
        if (op === -1) {
          return (
            <span
              key={i}
              className="bg-red-900/40 text-red-400 line-through opacity-70 rounded-sm"
            >
              {text}
            </span>
          )
        }
        return <span key={i}>{text}</span>
      })}
    </div>
  )
}
