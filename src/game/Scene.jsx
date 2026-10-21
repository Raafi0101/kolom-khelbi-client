import { useCallback, useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Table from './Table.jsx'
import Pen from './Pen.jsx'
import { P1_START, P2_START, PEN_RADIUS } from './constants.js'
import { useGameStore, setState, getState } from '../state/gameStore.js'
import { sendShot } from '../net/socket.js'
import { applyShotResult } from '../state/localGame.js'
import { computeAIShot } from '../ai/computerAI.js'

const MAX_DRAG_WORLD = 1.0
const MAX_IMPULSE = 2.5
const TABLE_BOUND_X = 1.2
const TABLE_BOUND_Z = 0.7
const TABLE_MIN_Y = -0.05

function quatToYaw([x, y, z, w]) {
    return Math.atan2(2 * (w * y + x * z), 1 - 2 * (y * y + z * z))
}

function isOnTable([x, y, z]) {
    return Math.abs(x) <= TABLE_BOUND_X + 0.1 && Math.abs(z) <= TABLE_BOUND_Z + 0.1 && y >= TABLE_MIN_Y
}

export default function Scene() {
    const { camera, size } = useThree()
    const state = useGameStore()
    const p1 = useRef(null)
    const p2 = useRef(null)
    const drag = useRef(null)
    const lastTurn = useRef(-1)
    const aiFiredTurn = useRef(-1)
    const [aim, setAim] = useState(null)
    const [pending, setPending] = useState(null)

    const isHumanTurn = state.soloMode
        ? state.phase === 'IN_PROGRESS' && state.currentTurn === 'P1'
        : state.phase === 'IN_PROGRESS' && state.currentTurn === state.mySlot

    const humanSlot = state.soloMode ? 'P1' : state.mySlot

    const pickWorld = useCallback(
        (clientX, clientY) => {
            const ndc = new THREE.Vector2(
                (clientX / size.width) * 2 - 1,
                -(clientY / size.height) * 2 + 1
            )
            const rc = new THREE.Raycaster()
            rc.setFromCamera(ndc, camera)
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -PEN_RADIUS * 2)
            const hit = new THREE.Vector3()
            rc.ray.intersectPlane(plane, hit)
            return hit
        },
        [camera, size]
    )

    const onPenDown = (slot) => (e) => {
        if (!isHumanTurn || slot !== humanSlot || pending) return
        const ref = slot === 'P1' ? p1 : p2
        if (!ref.current?.api) return
        e.stopPropagation()
        const start = pickWorld(e.nativeEvent.clientX, e.nativeEvent.clientY)
        drag.current = { start, api: ref.current.api, slot }
        setAim({ from: start, to: start })
        setState({ dragging: true })
    }

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
            const delta = end.clone().sub(d.start).multiplyScalar(-1) // slingshot
            delta.y = 0
            const len = delta.length()
            if (len < 0.08) return
            const dir = delta.normalize()
            const power = Math.min(1, len / MAX_DRAG_WORLD)
            const imp = dir.clone().multiplyScalar(power * MAX_IMPULSE)
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

    // Trigger AI shot in solo mode
    useEffect(() => {
        if (!state.soloMode || state.phase !== 'IN_PROGRESS' || state.currentTurn !== 'P2') {
            return
        }
        if (aiFiredTurn.current === state.turnNumber) {
            return
        }

        const timer = setTimeout(() => {
            const a1 = p1.current?.api
            const a2 = p2.current?.api
            if (!a1 || !a2) return

            aiFiredTurn.current = state.turnNumber

            const p1Pos = a1.position.get()
            const p2Pos = a2.position.get()

            const shot = computeAIShot({
                attackerPos: p2Pos,
                targetPos: p1Pos,
                difficulty: state.difficulty || 'medium',
            })

            const impX = shot.dirX * shot.power * MAX_IMPULSE
            const impZ = shot.dirZ * shot.power * MAX_IMPULSE
            a2.applyImpulse([impX, 0, impZ], [0, 0, 0])

            setPending({ ...shot, seq: Date.now(), soloAI: true })
        }, 1200)

        return () => clearTimeout(timer)
    }, [state.soloMode, state.phase, state.currentTurn, state.turnNumber, state.difficulty])

    // Wait for physics to settle, then apply local result or send ShotResult to server
    useEffect(() => {
        if (!pending) return
        const iv = setInterval(() => {
            const a1 = p1.current?.api
            const a2 = p2.current?.api
            if (!a1 || !a2) return
            const v1 = a1.velocity.get()
            const v2 = a2.velocity.get()
            const w1 = a1.angularVelocity.get()
            const w2 = a2.angularVelocity.get()
            const lv = Math.hypot(v1[0], v1[1], v1[2]) + Math.hypot(v2[0], v2[1], v2[2])
            const av = Math.hypot(w1[0], w1[1], w1[2]) + Math.hypot(w2[0], w2[1], w2[2])

            // Allow impulse at least 250ms to register in physics simulation before settle check
            if (Date.now() - pending.seq > 250 && lv < 0.15 && av < 0.4) {
                clearInterval(iv)
                const s = getState()
                const shooter = s.currentTurn
                const opp = shooter === 'P1' ? 'P2' : 'P1'
                const shooterApi = shooter === 'P1' ? a1 : a2
                const oppApi = opp === 'P1' ? a1 : a2
                const sp = shooterApi.position.get()
                const sq = shooterApi.quaternion.get()
                const op = oppApi.position.get()
                const oq = oppApi.quaternion.get()

                const shooterOnTable = isOnTable(sp)
                const opponentOnTable = isOnTable(op)

                if (s.soloMode) {
                    applyShotResult({
                        shooterSlot: shooter,
                        shooterOnTable,
                        opponentOnTable,
                    })
                } else {
                    sendShot({
                        roomId: s.roomId,
                        playerId: s.myPlayerId,
                        clientSequence: pending.seq,
                        dirX: pending.dirX,
                        dirZ: pending.dirZ,
                        power: pending.power,
                        spin: 0,
                        shooterX: sp[0],
                        shooterY: sp[1],
                        shooterZ: sp[2],
                        shooterRotY: quatToYaw(sq),
                        shooterOnTable,
                        opponentX: op[0],
                        opponentY: op[1],
                        opponentZ: op[2],
                        opponentRotY: quatToYaw(oq),
                        opponentOnTable,
                    })
                }
                setPending(null)
            }
        }, 100)
        return () => clearInterval(iv)
    }, [pending])

    // Reconcile with server on each new turn or reset positions on solo restart
    useEffect(() => {
        if (!p1.current?.api || !p2.current?.api) return

        if (state.soloMode && state.turnNumber === 0) {
            const resetPen = (ref, pos, rotY) => {
                if (!ref?.current?.api) return
                const api = ref.current.api
                api.position.set(pos[0], pos[1], pos[2])
                const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY)
                api.quaternion.set(q.x, q.y, q.z, q.w)
                api.velocity.set(0, 0, 0)
                api.angularVelocity.set(0, 0, 0)
            }
            resetPen(p1, P1_START, 0)
            resetPen(p2, P2_START, Math.PI)
            lastTurn.current = 0
            aiFiredTurn.current = -1
            return
        }

        if (!state.players) return
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
    }, [state])

    return (
        <>
            <OrbitControls
                makeDefault
                target={[0, 0, 0]}
                enablePan={false}
                minDistance={1.5}
                maxDistance={5}
                maxPolarAngle={Math.PI / 2.2}
                enabled={!state.dragging}
            />
            <Table />
            <Pen
                position={P1_START}
                rotationY={0}
                color="#d62828"
                onReady={(api) => (p1.current = { api })}
                onPointerDown={onPenDown('P1')}
            />
            <Pen
                position={P2_START}
                rotationY={Math.PI}
                color="#1d4ed8"
                onReady={(api) => (p2.current = { api })}
                onPointerDown={onPenDown('P2')}
            />
            {aim && <AimArrow from={aim.from} to={aim.to} />}
        </>
    )
}

function AimArrow({ from, to }) {
    const delta = to.clone().sub(from)
    const len = Math.max(0.01, delta.length())
    const angle = Math.atan2(delta.x, delta.z)
    const mid = from.clone().add(delta.clone().multiplyScalar(-0.5)) // opposite of drag
    return (
        <mesh position={[mid.x, 0.06, mid.z]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.02, 0.02, len]} />
            <meshBasicMaterial color="#fbbf24" />
        </mesh>
    )
}
