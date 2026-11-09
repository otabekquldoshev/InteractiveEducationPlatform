export const SPACE_TOKEN = "SPACE" as const

export type SurdoToken = typeof SPACE_TOKEN | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z" | "O'" | "G'" | "SH" | "CH" | "NG"

const APOSTROPHES = /['ʻʼ‘’`´]/g
const LETTER = /^[A-Z]$/

export function normalizeSurdoText(value: string) {
  return value.normalize("NFC").toUpperCase().replace(APOSTROPHES, "'")
}

export function tokenizeSurdoText(value: string): SurdoToken[] {
  const normalized = normalizeSurdoText(value)
  const tokens: SurdoToken[] = []
  let pendingSpace = false

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index]
    const next = normalized[index + 1]

    if (/\s/.test(character)) {
      pendingSpace = tokens.length > 0
      continue
    }

    let token: SurdoToken | null = null
    if ((character === "O" || character === "G") && next === "'") {
      token = (`${character}'` as SurdoToken)
      index += 1
    } else if (["SH", "CH", "NG"].includes(`${character}${next}`)) {
      token = (`${character}${next}` as SurdoToken)
      index += 1
    } else if (LETTER.test(character)) {
      token = (character as SurdoToken)
    }

    if (!token) continue
    if (pendingSpace && tokens.at(-1) !== SPACE_TOKEN) tokens.push(SPACE_TOKEN)
    tokens.push(token)
    pendingSpace = false
  }

  return tokens
}

export function displaySurdoToken(token: SurdoToken) {
  if (token === SPACE_TOKEN) return "Oraliq"
  return token.replace("O'", "O‘").replace("G'", "G‘")
}
