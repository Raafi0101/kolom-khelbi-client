import { useCallback, useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Table from './Table.jsx'
import Pen from './Pen.jsx'
import { P1_START, P2_START } from './constants.js'
import { useGameStore, setState, getState } from '../state/gameStore.js'
import { sendShot } from '../net/socket.js'
import { applyShotResult } from '../state/localGame.js'
import { computeAIShot } from '../ai/computerAI.js'
import { playFlickSound } from '../audio/soundEffects.js'

const MAX_DRAG_WORLD = 1.0
const MAX_IMPULSE = 2.6
const TABLE_BOUND_X = 1.22
const TABLE_BOUND_Z = 0.72
const TABLE_MIN_Y = -0.03

function quatToYaw([x, y, z, w]) {
    return Math.atan2(2 * (w * y + x * z), 1 - 2 * (y * y + z * z))
}

function isPenOnTable(pos) {
    if (!pos) return false
    const [x, y, z] = pos
    return (
        Math.abs(x) <= TABLE_BOUND_X &&
        Math.abs(z) <= TABLE_BOUND_Z &&
        y >= TABLE_MIN_Y
    )
}

function handleShotResult({ shooter, sp1, sq1, on1, sp2, sq2, on2, seq, dirX, dirZ, power }) {
    const s = getState()
    const shooterOnTable = shooter === 'P1' ? on1 : on2
    const opponentOnTable = shooter === 'P1' ? on2 : on1

    if (s.soloMode) {
        applyShotResult({
            shooterSlot: shooter,
            shooterOnTable,
            opponentOnTable,
        })
    } else {
        const shooterApi = shooter === 'P1' ? { p: sp1, q: sq1, on: on1 } : { p: sp2, q: sq2, on: on2 }
        const oppApi = shooter === 'P1' ? { p: sp2, q: sq2, on: on2 } : { p: sp1, q: sq1, on: on1 }

        sendShot({
            roomId: s.roomId,
            playerId: s.myPlayerId,
            clientSequence: seq || Date.now(),
            dirX: dirX || 0,
            dirZ: dirZ || 0,
            power: power || 0,
            spin: 0,
            shooterX: shooterApi.p[0],
            shooterY: shooterApi.p[1],
            shooterZ: shooterApi.p[2],
            shooterRotY: quatToYaw(shooterApi.q),
            shooterOnTable: shooterApi.on,
            opponentX: oppApi.p[0],
            opponentY: oppApi.p[1],
            opponentZ: oppApi.p[2],
            opponentRotY: quatToYaw(oppApi.q),
            opponentOnTable: oppApi.on,
        })
    }
}

export default function Scene() {
    const { camera, size } = useThree()
    const state = useGameStore()
    const p1 = useRef(null)
    const p2 = useRef(null)
    const drag = useRef(null)
    const lastTurn = useRef(-1)
    const aiFiredTurn = useRef('')
    const [aim, setAim] = useState(null)
    const [pending, setPending] = useState(null)

    const isPlayable = state.roundStatus === 'PLAYING' && state.phase === 'IN_PROGRESS'

    const isHumanTurn = state.soloMode
        ? isPlayable && state.currentTurn === 'P1'
        : isPlayable && state.currentTurn === state.mySlot

    const humanSlot = state.soloMode ? 'P1' : state.mySlot

    // Raycast onto table surface (y = 0 plane)
    const pickWorld = useCallback(
        (clientX, clientY) => {
            const ndc = new THREE.Vector2(
                (clientX / size.width) * 2 - 1,
                -(clientY / size.height) * 2 + 1
            )
            const rc = new THREE.Raycaster()
            rc.setFromCamera(ndc, camera)
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
            const hit = new THREE.Vector3()
            rc.ray.intersectPlane(plane, hit)
            return hit
        },
        [camera, size]
    )

    // Reset pens back onto table with 0 velocity
    const resetPensToTable = useCallback(() => {
        const a1 = p1.current?.api
        const a2 = p2.current?.api
        if (!a1 || !a2) return

        a1.position.set(P1_START[0], P1_START[1], P1_START[2])
        const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0)
        a1.quaternion.set(q1.x, q1.y, q1.z, q1.w)
        a1.velocity.set(0, 0, 0)
        a1.angularVelocity.set(0, 0, 0)

        a2.position.set(P2_START[0], P2_START[1], P2_START[2])
        const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
        a2.quaternion.set(q2.x, q2.y, q2.z, q2.w)
        a2.velocity.set(0, 0, 0)
        a2.angularVelocity.set(0, 0, 0)
    }, [])

    // Trigger reset on round changes or when turnNumber is 0
    useEffect(() => {
        if (!state.soloMode) return
        if (state.roundStatus === 'PLAYING' && state.turnNumber === 0) {
            resetPensToTable()
            const t = setTimeout(resetPensToTable, 60)
            return () => clearTimeout(t)
        }
    }, [state.soloMode, state.roundNumber, state.roundStatus, state.turnNumber, resetPensToTable])

    // Pointer Down on Pen
    const onPenDown = (slot) => (e) => {
        if (!isHumanTurn || slot !== humanSlot || pending) return
        const ref = slot === 'P1' ? p1 : p2
        if (!ref.current?.api) return
        e.stopPropagation()

        const hit = pickWorld(e.nativeEvent.clientX, e.nativeEvent.clientY)
        const penPos = ref.current.api.position.get()
        const startPos = new THREE.Vector3(penPos[0], 0.04, penPos[2])

        drag.current = { start: startPos, api: ref.current.api, slot }
        setAim({ from: startPos, to: hit })
        setState({ dragging: true })
    }

    // Drag move & release
    useEffect(() => {
        const onMove = (e) => {
            if (!drag.current) return
            const cur = pickWorld(e.clientX, e.clientY)
            setAim({ from: drag.current.start, to: cur })
        }

        const onUp = (e) => {
            const d = drag.current
            drag.current = null
            setAim(null)
            setState({ dragging: false })
            if (!d) return

            const end = pickWorld(e.clientX, e.clientY)
            // Slingshot pull vector: pulling away shoots forward (360 degrees full freedom)
            const delta = d.start.clone().sub(end)
            delta.y = 0
            const len = delta.length()
            if (len < 0.05) return

            const dir = delta.normalize()
            const power = Math.min(1, Math.max(0.12, len / MAX_DRAG_WORLD))
            const imp = dir.clone().multiplyScalar(power * MAX_IMPULSE)

            playFlickSound(power)
            d.api.applyImpulse([imp.x, 0, imp.z], [0, 0, 0])
            setPending({ dirX: dir.x, dirZ: dir.z, power, seq: Date.now() })
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onUp)
        return () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onUp)
        }
    }, [pickWorld])

    // AI Shot Trigger in Solo Mode
    useEffect(() => {
        if (
            !state.soloMode ||
            state.phase !== 'IN_PROGRESS' ||
            state.roundStatus !== 'PLAYING' ||
            state.currentTurn !== 'P2' ||
            pending
        ) {
            return
        }

        const roundTurnKey = `${state.roundNumber}_${state.turnNumber}`
        if (aiFiredTurn.current === roundTurnKey) return

        const timer = setTimeout(() => {
            const a1 = p1.current?.api
            const a2 = p2.current?.api
            if (!a1 || !a2) return

            aiFiredTurn.current = roundTurnKey

            const p1Pos = a1.position.get()
            const p2Pos = a2.position.get()

            const shot = computeAIShot({
                attackerPos: p2Pos,
                targetPos: p1Pos,
                difficulty: state.difficulty || 'medium',
            })

            const impX = shot.dirX * shot.power * MAX_IMPULSE
            const impZ = shot.dirZ * shot.power * MAX_IMPULSE

            playFlickSound(shot.power)
            a2.applyImpulse([impX, 0, impZ], [0, 0, 0])

            setPending({ ...shot, seq: Date.now(), soloAI: true })
        }, 1100)

        return () => clearTimeout(timer)
    }, [
        state.soloMode,
        state.phase,
        state.roundStatus,
        state.currentTurn,
        state.turnNumber,
        state.roundNumber,
        state.difficulty,
        pending,
    ])

    // Physics Settle & Immediate Fall Resolution
    useEffect(() => {
        if (!pending) return

        let elapsed = 0
        const iv = setInterval(() => {
            elapsed += 40
            const a1 = p1.current?.api
            const a2 = p2.current?.api
            if (!a1 || !a2) return

            const sp1 = a1.position.get()
            const sq1 = a1.quaternion.get()
            const sp2 = a2.position.get()
            const sq2 = a2.quaternion.get()

            const v1 = a1.velocity.get()
            const v2 = a2.velocity.get()
            const w1 = a1.angularVelocity.get()
            const w2 = a2.angularVelocity.get()

            const on1 = isPenOnTable(sp1)
            const on2 = isPenOnTable(sp2)

            // CRITICAL: If either pen has fallen off table, resolve immediately without waiting for free-fall to stop
            if (!on1 || !on2) {
                if (!on1) {
                    a1.velocity.set(0, 0, 0)
                    a1.angularVelocity.set(0, 0, 0)
                }
                if (!on2) {
                    a2.velocity.set(0, 0, 0)
                    a2.angularVelocity.set(0, 0, 0)
                }

                if (elapsed >= 320) {
                    clearInterval(iv)
                    handleShotResult({
                        shooter: getState().currentTurn,
                        sp1, sq1, on1,
                        sp2, sq2, on2,
                        seq: pending.seq,
                        dirX: pending.dirX,
                        dirZ: pending.dirZ,
                        power: pending.power,
                    })
                    setPending(null)
                    return
                }
            }

            // Normal settle check when both pens are on table
            const lv = Math.hypot(v1[0], v1[1], v1[2]) + Math.hypot(v2[0], v2[1], v2[2])
            const av = Math.hypot(w1[0], w1[1], w1[2]) + Math.hypot(w2[0], w2[1], w2[2])

            if (elapsed >= 300 && ((lv < 0.12 && av < 0.35) || elapsed > 4000)) {
                clearInterval(iv)
                handleShotResult({
                    shooter: getState().currentTurn,
                    sp1, sq1, on1,
                    sp2, sq2, on2,
                    seq: pending.seq,
                    dirX: pending.dirX,
                    dirZ: pending.dirZ,
                    power: pending.power,
                })
                setPending(null)
            }
        }, 40)

        return () => clearInterval(iv)
    }, [pending])

    // Multiplayer snap reconciliation
    useEffect(() => {
        if (state.soloMode || !p1.current?.api || !p2.current?.api || !state.players) return
        if (state.turnNumber <= lastTurn.current) return
        lastTurn.current = state.turnNumber

        const snap = (ref, p) => {
            if (!ref?.current?.api || !p) return
            const api = ref.current.api
            api.position.set(p.x, p.y, p.z)
            const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rotY)
            api.quaternion.set(q.x, q.y, q.z, q.w)
            api.velocity.set(0, 0, 0)
            api.angularVelocity.set(0, 0, 0)
        }
        snap(p1, state.players.P1)
        snap(p2, state.players.P2)
    }, [state.soloMode, state.turnNumber, state.players])

    return (
        <>
            {/* Table & Camera are completely FIXED (OrbitControls disabled so board never moves) */}
            <OrbitControls
                makeDefault
                target={[0, 0, 0]}
                enableRotate={false}
                enablePan={false}
                enableZoom={false}
            />

            <Table />

            <Pen
                position={P1_START}
                rotationY={0}
                styleId={state.selectedPen || 'pinpoint'}
                onReady={(api) => (p1.current = { api })}
                onPointerDown={onPenDown('P1')}
            />
            <Pen
                position={P2_START}
                rotationY={Math.PI}
                styleId={state.aiPen || 'all_time_blue'}
                onReady={(api) => (p2.current = { api })}
                onPointerDown={onPenDown('P2')}
            />

            {/* 360-Degree Trajectory Guide Arrow and Slingshot Line */}
            {aim && <AimTrajectoryGuide from={aim.from} to={aim.to} />}
        </>
    )
}

/**
 * 360-Degree Aiming Visualizer:
 * Shows a forward trajectory arrow pointing in the exact shooting direction,
 * an arrowhead, a slingshot pull line, and a glowing base ring.
 */
function AimTrajectoryGuide({ from, to }) {
    const delta = from.clone().sub(to)
    delta.y = 0
    const len = delta.length()
    if (len < 0.03) return null

    const dir = delta.clone().normalize()
    const power = Math.min(1, Math.max(0.15, len / MAX_DRAG_WORLD))

    // Arrow length proportional to power (up to 0.85m)
    const arrowLen = 0.2 + power * 0.65
    const angle = Math.atan2(dir.x, dir.z)

    // Dynamic color based on power
    const color =
        power < 0.4
            ? '#22c55e' // Green for light shots
            : power < 0.75
            ? '#fbbf24' // Yellow for medium shots
            : '#ef4444' // Red for max power smash!

    // Midpoint of the forward arrow shaft
    const shaftMidX = from.x + (dir.x * arrowLen) / 2
    const shaftMidZ = from.z + (dir.z * arrowLen) / 2

    // Tip position for arrowhead
    const tipX = from.x + dir.x * arrowLen
    const tipZ = from.z + dir.z * arrowLen

    // Midpoint of elastic pull string
    const pullMidX = (from.x + to.x) / 2
    const pullMidZ = (from.z + to.z) / 2
    const pullAngle = Math.atan2(to.x - from.x, to.z - from.z)

    return (
        <group position={[0, 0.045, 0]}>
            {/* 1. Forward Trajectory Shaft */}
            <mesh position={[shaftMidX, 0, shaftMidZ]} rotation={[0, angle, 0]}>
                <cylinderGeometry args={[0.014, 0.014, arrowLen, 12]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* 2. Forward Arrowhead Cone */}
            <mesh position={[tipX, 0, tipZ]} rotation={[0, angle, 0]}>
                <coneGeometry args={[0.04, 0.08, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* 3. Slingshot Pull Line (Behind Pen) */}
            <mesh position={[pullMidX, 0, pullMidZ]} rotation={[0, pullAngle, 0]}>
                <cylinderGeometry args={[0.006, 0.006, len, 8]} />
                <meshBasicMaterial color="rgba(255,255,255,0.6)" transparent opacity={0.6} />
            </mesh>

            {/* 4. Glowing Power Ring at Pen Base */}
            <mesh position={[from.x, -0.01, from.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.07, 0.09 + power * 0.04, 24]} />
                <meshBasicMaterial color={color} transparent opacity={0.7} />
            </mesh>
        </group>
    )
}
