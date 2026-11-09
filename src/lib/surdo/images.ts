import { SPACE_TOKEN, type SurdoToken } from "./tokenizer"

const IMAGE_BASE = "/surdo/alphabet"

const IMAGE_FILE_BY_TOKEN: Partial<Record<SurdoToken, string>> = {
  A: "a.png",
  B: "b.png",
  D: "d.png",
  E: "e.png",
  F: "f.png",
  G: "g.png",
  H: "h.png",
  I: "i.png",
  J: "j.png",
  K: "k.png",
  L: "l.png",
  M: "m.png",
  N: "n.png",
  O: "o.png",
  P: "p.png",
  Q: "q.png",
  R: "r.png",
  S: "s.png",
  T: "t.png",
  U: "u.png",
  V: "v.png",
  X: "x.png",
  Y: "y.png",
  Z: "z.png",
  "O'": "o-apostrophe.png",
  "G'": "g-apostrophe.png",
  SH: "sh.png",
  CH: "ch.png",
  NG: "ng.png",
}

export function getSurdoImageUrl(token: SurdoToken | null) {
  if (!token || token === SPACE_TOKEN) return null
  const file = IMAGE_FILE_BY_TOKEN[token]
  return file ? `${IMAGE_BASE}/${file}` : null
}
