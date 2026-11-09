import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { HAND_POSES, NEUTRAL_POSE, type HandPose } from "../../lib/surdo/poses"
import { SPACE_TOKEN, type SurdoToken } from "../../lib/surdo/tokenizer"
import { useLanguage } from "../../contexts/LanguageContext"

interface HandViewerProps {
  token: SurdoToken | null
  speed: number
  onStatusChange: (status: "loading" | "ready" | "error") => void
}

const CHAINS = {
  thumb: [
    "thumb-metacarpal",
    "thumb-phalanx-proximal",
    "thumb-phalanx-distal",
    "thumb-tip",
  ],
  index: [
    "index-finger-metacarpal",
    "index-finger-phalanx-proximal",
    "index-finger-phalanx-intermediate",
    "index-finger-phalanx-distal",
    "index-finger-tip",
  ],
  middle: [
    "middle-finger-metacarpal",
    "middle-finger-phalanx-proximal",
    "middle-finger-phalanx-intermediate",
    "middle-finger-phalanx-distal",
    "middle-finger-tip",
  ],
  ring: [
    "ring-finger-metacarpal",
    "ring-finger-phalanx-proximal",
    "ring-finger-phalanx-intermediate",
    "ring-finger-phalanx-distal",
    "ring-finger-tip",
  ],
  pinky: [
    "pinky-finger-metacarpal",
    "pinky-finger-phalanx-proximal",
    "pinky-finger-phalanx-intermediate",
    "pinky-finger-phalanx-distal",
    "pinky-finger-tip",
  ],
} as const

type FingerName = keyof Pick<typeof CHAINS, "index" | "middle" | "ring" | "pinky">
type BoneState = {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.geometry?.dispose()
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material]
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose()
      })
      material.dispose()
    })
  })
}

export default function HandViewer({
  token,
  speed,
  onStatusChange,
}: HandViewerProps) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const statusCallbackRef = useRef(onStatusChange)
  const applyPoseRef = useRef<(pose: HandPose) => void>(() => undefined)
  const tokenRef = useRef(token)
  const speedRef = useRef(speed)

  useEffect(() => {
    statusCallbackRef.current = onStatusChange
  }, [onStatusChange])

  useEffect(() => {
    tokenRef.current = token
    applyPoseRef.current(
      token && token !== SPACE_TOKEN ? HAND_POSES[token] : NEUTRAL_POSE,
    )
  }, [token])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      })
    } catch {
      statusCallbackRef.current("error")
      return
    }

    statusCallbackRef.current("loading")
    let disposed = false
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 30)
    camera.up.set(0, -1, 0)
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.enablePan = false
    controls.enableRotate = false
    controls.enableZoom = false
    controls.minDistance = 0.72
    controls.maxDistance = 2.3
    controls.minPolarAngle = 0.4
    controls.maxPolarAngle = Math.PI - 0.4

    const resetCamera = () => {
      // The reference requires the palm to face the interlocutor. The GLB's
      // palm faces -X, so the camera must stay on that side of the model.
      camera.position.set(-1.35, -0.02, 0.78)
      controls.target.set(0, 0, 0)
      controls.update()
    }
    resetCamera()

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08

    scene.add(new THREE.HemisphereLight(0xd7fff4, 0x102638, 2.45))
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2)
    keyLight.position.set(2.4, -2.2, 2.5)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0x68bfff, 3.4)
    rimLight.position.set(-1.5, 1.2, -2.5)
    scene.add(rimLight)

    const motionRoot = new THREE.Group()
    const poseRoot = new THREE.Group()
    motionRoot.add(poseRoot)
    scene.add(motionRoot)

    const bones = new Map<string, THREE.Object3D>()
    const rest = new Map<string, BoneState>()
    const targets = new Map<string, BoneState>()
    let targetRootQuaternion = new THREE.Quaternion()
    let currentToken: SurdoToken | null = tokenRef.current
    let poseStartedAt = performance.now()
    const xAxis = new THREE.Vector3(1, 0, 0)
    const yAxis = new THREE.Vector3(0, 1, 0)
    const zAxis = new THREE.Vector3(0, 0, 1)

    const resetTargets = () => {
      rest.forEach((state, name) => {
        targets.set(name, {
          position: state.position.clone(),
          quaternion: state.quaternion.clone(),
        })
      })
    }

    const poseFinger = (
      name: FingerName,
      curlValue: number | number[],
      spread = 0,
    ) => {
      const chain = CHAINS[name]
        .map((boneName) => bones.get(boneName))
        .filter(Boolean) as THREE.Object3D[]
      if (chain.length !== 5) return
      const curl = Array.isArray(curlValue)
        ? curlValue.map((value) => value * 1.04)
        : [curlValue * 1.35, curlValue * 2.35, curlValue * 3.05]
      let currentPosition = rest.get(chain[1].name)!.position.clone()

      for (let segment = 1; segment <= 3; segment += 1) {
        const current = chain[segment]
        const next = chain[segment + 1]
        const currentRest = rest.get(current.name)!
        const nextRest = rest.get(next.name)!
        const restDirection = nextRest.position
          .clone()
          .sub(currentRest.position)
        const length = restDirection.length()
        const restUnit = restDirection.clone().normalize()
        const targetDirection = restUnit
          .clone()
          .applyAxisAngle(zAxis, curl[segment - 1])
          .applyAxisAngle(xAxis, spread)
        const quaternion = new THREE.Quaternion()
          .setFromUnitVectors(restUnit, targetDirection)
          .multiply(currentRest.quaternion.clone())
        targets.set(current.name, {
          position: currentPosition.clone(),
          quaternion,
        })
        currentPosition = currentPosition
          .clone()
          .add(targetDirection.multiplyScalar(length))
        targets.set(next.name, {
          position: currentPosition.clone(),
          quaternion: quaternion.clone(),
        })
      }
    }

    const poseThumb = (pose: HandPose["thumb"]) => {
      const chain = CHAINS.thumb
        .map((boneName) => bones.get(boneName))
        .filter(Boolean) as THREE.Object3D[]
      if (chain.length !== 4) return
      // This GLB stores the thumb joints as sibling bones. A wider arc is
      // required so opposed-thumb letters do not all look like the same fist.
      const bend = [pose.curl * 0.9, pose.curl * 1.55, pose.curl * 2.15]
      let currentPosition = rest.get(chain[0].name)!.position.clone()

      for (let segment = 0; segment < 3; segment += 1) {
        const current = chain[segment]
        const next = chain[segment + 1]
        const currentRest = rest.get(current.name)!
        const nextRest = rest.get(next.name)!
        const restDirection = nextRest.position
          .clone()
          .sub(currentRest.position)
        const length = restDirection.length()
        const restUnit = restDirection.clone().normalize()
        const targetDirection = restUnit
          .clone()
          .applyAxisAngle(yAxis, pose.oppose * 1.18)
          .applyAxisAngle(zAxis, bend[segment])
          .applyAxisAngle(xAxis, pose.spread * 0.58)
        const quaternion = new THREE.Quaternion()
          .setFromUnitVectors(restUnit, targetDirection)
          .multiply(currentRest.quaternion.clone())
        targets.set(current.name, {
          position: currentPosition.clone(),
          quaternion,
        })
        currentPosition = currentPosition
          .clone()
          .add(targetDirection.multiplyScalar(length))
        targets.set(next.name, {
          position: currentPosition.clone(),
          quaternion: quaternion.clone(),
        })
      }
    }

    applyPoseRef.current = (pose) => {
      if (!bones.size) return
      resetTargets()
      ;(["index", "middle", "ring", "pinky"] as FingerName[]).forEach(
        (finger) => {
          poseFinger(finger, pose.fingers[finger], pose.spread[finger] || 0)
        },
      )
      poseThumb(pose.thumb)
      targetRootQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...pose.rotation, "XYZ"),
      )
      currentToken = tokenRef.current
      poseStartedAt = performance.now()
    }

    const loader = new GLTFLoader()
    loader.load(
      "/models/surdo-hand-right.glb",
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene)
          return
        }
        const model = gltf.scene
        model.scale.setScalar(4.4)
        model.updateMatrixWorld(true)
        model.traverse((object) => {
          const mesh = object as THREE.Mesh
          if (!mesh.isMesh) return
          mesh.frustumCulled = false
          const previous = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          previous.forEach((material) => material.dispose())
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xf1b58e,
            roughness: 0.58,
            metalness: 0.015,
          })
        })
        Object.values(CHAINS)
          .flat()
          .forEach((name) => {
            const bone = model.getObjectByName(name)
            if (!bone) return
            bones.set(name, bone)
            const state = {
              position: bone.position.clone(),
              quaternion: bone.quaternion.clone(),
            }
            rest.set(name, state)
            targets.set(name, {
              position: state.position.clone(),
              quaternion: state.quaternion.clone(),
            })
          })
        if (bones.size !== 24) {
          disposeObject(model)
          statusCallbackRef.current("error")
          return
        }
        const center = new THREE.Box3()
          .setFromObject(model)
          .getCenter(new THREE.Vector3())
        model.position.sub(center)
        poseRoot.add(model)
        applyPoseRef.current(
          tokenRef.current && tokenRef.current !== SPACE_TOKEN
            ? HAND_POSES[tokenRef.current]
            : NEUTRAL_POSE,
        )
        statusCallbackRef.current("ready")
      },
      undefined,
      () => {
        if (!disposed) statusCallbackRef.current("error")
      },
    )

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const clock = new THREE.Clock()
    renderer.setAnimationLoop((time) => {
      const delta = Math.min(clock.getDelta(), 0.05)
      const blend = reducedMotion ? 1 : 1 - Math.exp(-delta * 11.5)
      targets.forEach((target, name) => {
        const bone = bones.get(name)
        if (!bone) return
        bone.position.lerp(target.position, blend)
        bone.quaternion.slerp(target.quaternion, blend)
      })
      poseRoot.quaternion.slerp(targetRootQuaternion, blend)

      if (!reducedMotion && currentToken && currentToken !== SPACE_TOKEN) {
        const cycle = Math.min(
          1,
          (time - poseStartedAt) / (900 / speedRef.current),
        )
        let horizontal = 0
        let vertical = 0
        if (currentToken === "D" || currentToken === "O'") {
          horizontal = Math.cos(cycle * Math.PI * 2) * 0.035
          vertical = Math.sin(cycle * Math.PI * 2) * 0.035
        } else if (currentToken === "H" || currentToken === "Q") {
          horizontal = Math.sin(cycle * Math.PI) * 0.025
          vertical = -0.06 * cycle
        } else if (currentToken === "K") {
          horizontal = THREE.MathUtils.lerp(0.045, -0.045, cycle)
        } else if (currentToken === "Y") {
          horizontal = Math.sin(cycle * Math.PI * 2) * 0.025
          vertical = -Math.sin(cycle * Math.PI) * 0.035
        } else if (currentToken === "Z") {
          if (cycle < 0.33) {
            horizontal = THREE.MathUtils.lerp(-0.055, 0.055, cycle / 0.33)
            vertical = 0.04
          } else if (cycle < 0.66) {
            horizontal = THREE.MathUtils.lerp(
              0.055,
              -0.055,
              (cycle - 0.33) / 0.33,
            )
            vertical = THREE.MathUtils.lerp(0.04, -0.04, (cycle - 0.33) / 0.33)
          } else {
            horizontal = THREE.MathUtils.lerp(
              -0.055,
              0.055,
              (cycle - 0.66) / 0.34,
            )
            vertical = -0.04
          }
        } else if (currentToken === "G'") {
          horizontal = Math.sin(cycle * Math.PI * 2) * 0.018
        }
        motionRoot.position.z += (horizontal - motionRoot.position.z) * blend
        motionRoot.position.y += (vertical - motionRoot.position.y) * blend
      }
      controls.update()
      renderer.render(scene, camera)
    })

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = wrap.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(wrap)
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      statusCallbackRef.current("error")
    }
    canvas.addEventListener("webglcontextlost", handleContextLost)

    return () => {
      disposed = true
      applyPoseRef.current = () => undefined
      resizeObserver.disconnect()
      canvas.removeEventListener("webglcontextlost", handleContextLost)
      renderer.setAnimationLoop(null)
      controls.dispose()
      disposeObject(scene)
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="relative h-[310px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 sm:h-[380px]"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none h-full w-full touch-none"
        aria-label={t("surdo_letter_image")}
      />
    </div>
  )
}
