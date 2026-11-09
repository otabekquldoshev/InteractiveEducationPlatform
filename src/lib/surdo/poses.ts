import type { SurdoToken } from "./tokenizer"

type Curl = number | [number, number, number]

export interface HandPose {
  fingers: Record<"index" | "middle" | "ring" | "pinky", Curl>
  thumb: {
    curl: number
    oppose: number
    spread: number
  }
  spread: Partial<Record<"index" | "middle" | "ring" | "pinky", number>>
  rotation: [number, number, number]
}

const fingerShape = (
  index: Curl,
  middle: Curl,
  ring: Curl,
  pinky: Curl,
  thumb: Partial<HandPose["thumb"]> = {},
  options: Pick<Partial<HandPose>, "spread" | "rotation"> = {},
): HandPose => ({
  fingers: { index, middle, ring, pinky },
  thumb: { curl: 0, oppose: 0, spread: 0, ...thumb },
  spread: options.spread || {},
  rotation: options.rotation || [0, 0, 0],
})

export const NEUTRAL_POSE = fingerShape(
  0.03,
  0.03,
  0.03,
  0.05,
  { curl: 0.02, oppose: 0.05 },
  { spread: { index: -0.08, middle: -0.02, ring: 0.06, pinky: 0.14 } },
)

// Source: Nizomiy TDPU, “Daktilologiya va imo-ishora nutqi”, pp. 49–52.
// C and W are compatibility fallbacks; the referenced Uzbek manual alphabet
// instead documents CH, SH and NG as their own daktil signs.
export const HAND_POSES: Record<Exclude<SurdoToken, "SPACE">, HandPose> = {
  A: fingerShape(1, 1, 1, 1, { curl: 0.9, oppose: 1 }),
  B: fingerShape(0, 1, 1, 1, { curl: 0.75, oppose: 0.9 }),
  C: fingerShape(0.68, 0.68, 0.7, 0.72, { curl: 0.58, oppose: 0.52 }),
  D: fingerShape(0.04, 0.06, 1, 1, { curl: 0.78, oppose: 0.9 }, {
    spread: { index: -0.02, middle: 0.02 },
    rotation: [0, 0.2, -1.05],
  }),
  E: fingerShape(0.62, 0.66, 0.72, 0.78, { curl: 0.52, oppose: 0.5 }),
  F: fingerShape(0.03, 0.03, 0.04, 0.05, { curl: 0.85, oppose: 0.96 }, {
    spread: { index: -0.03, middle: -0.01, ring: 0.02, pinky: 0.04 },
    rotation: [0, 0.12, -1],
  }),
  G: fingerShape(0.02, 1, 1, 1, { curl: 0.02, oppose: 0, spread: 0.26 }, {
    rotation: [0.02, 0.72, -0.08],
  }),
  H: fingerShape([0.1, 0.72, 0.92], 1, 1, 1, { curl: 0.74, oppose: 0.9 }),
  I: fingerShape(0.02, 0.03, 1, 1, { curl: 0.82, oppose: 0.96 }, {
    spread: { index: -0.03, middle: 0.03 },
  }),
  J: fingerShape(0.08, 0.08, 0.1, 0.12, { curl: 0.82, oppose: 0.95 }, {
    rotation: [0, 0.12, -1],
  }),
  K: fingerShape(0.02, 0.03, 1, 1, { curl: 0.78, oppose: 0.92 }, {
    spread: { index: -0.03, middle: 0.03 },
  }),
  L: fingerShape(0.02, 0.03, 1, 1, { curl: 0.76, oppose: 0.9 }, {
    rotation: [0, 0, 2.85],
  }),
  M: fingerShape(0.03, 0.03, 0.04, 1, { curl: 0.8, oppose: 0.94 }, {
    rotation: [0, 0, 2.85],
  }),
  N: fingerShape(0.02, 0.03, 0.04, 1, { curl: 0.74, oppose: 0.88 }, {
    spread: { index: -0.18, middle: 0, ring: 0.18 },
  }),
  O: fingerShape(0.56, 1, 1, 1, { curl: 0.54, oppose: 0.62 }),
  P: fingerShape(0.02, 0.03, 1, 1, { curl: 0.76, oppose: 0.9 }, {
    rotation: [0, 0, 2.85],
  }),
  Q: fingerShape(0.02, 0.03, 1, 1, { curl: 0.76, oppose: 0.9 }, {
    spread: { index: -0.03, middle: 0.03 },
  }),
  R: fingerShape(0.04, 0.04, 1, 1, { curl: 0.5, oppose: 0.74 }, {
    spread: { index: -0.16, middle: 0.16 },
  }),
  S: fingerShape(0.58, 0.62, 0.68, 0.74, { curl: 0.48, oppose: 0.46 }),
  T: fingerShape(0.03, 0.03, 0.04, 1, { curl: 0.82, oppose: 0.95 }, {
    rotation: [0, 0, 2.85],
  }),
  U: fingerShape(1, 1, 1, 0.02, { curl: 0, oppose: -0.08, spread: 0.3 }, {
    spread: { pinky: 0.16 },
    rotation: [0, 0.05, -1],
  }),
  V: fingerShape(
    0.02,
    0.02,
    0.02,
    0.02,
    { curl: 0, oppose: -0.08, spread: 0.18 },
    {
      spread: { index: -0.16, middle: -0.05, ring: 0.06, pinky: 0.17 },
    },
  ),
  W: fingerShape(0.02, 0.03, 0.04, 1, { curl: 0.72, oppose: 0.86 }, {
    spread: { index: -0.18, middle: 0, ring: 0.18 },
  }),
  X: fingerShape([0.12, 0.72, 0.94], 1, 1, 1, { curl: 0.3, oppose: 0.34 }),
  Y: fingerShape(0.02, 1, 1, 1, { curl: 0.76, oppose: 0.9 }),
  Z: fingerShape(0.02, 1, 1, 1, { curl: 0.76, oppose: 0.9 }),
  "O'": fingerShape(1, 1, 1, 0.02, { curl: 0, oppose: -0.08, spread: 0.3 }, {
    spread: { pinky: 0.16 },
  }),
  "G'": fingerShape(0.02, 1, 1, 1, { curl: 0.02, oppose: 0, spread: 0.26 }, {
    rotation: [0.02, 0.72, -0.08],
  }),
  SH: fingerShape(0.02, 0.02, 0.02, 0.02, { curl: 0.82, oppose: 0.98 }, {
    spread: { index: -0.03, middle: -0.01, ring: 0.02, pinky: 0.04 },
  }),
  CH: fingerShape(0.74, 0.74, 0.82, 0.86, { curl: 0.76, oppose: 0.9 }),
  NG: fingerShape(0.02, 0.03, 1, 0.04, { curl: 0.06, oppose: 0.08 }, {
    spread: { index: -0.16, middle: 0.05, pinky: 0.2 },
    rotation: [0.02, 0.68, -0.08],
  }),
}
