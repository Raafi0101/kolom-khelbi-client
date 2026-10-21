import { Client } from '@stomp/stompjs'
import { setState } from '../state/gameStore.js'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws-game'

let client = null
let roomSub = null

export function connect() {
    if (client?.active) return client

    client = new Client({
        brokerURL: WS_URL,
        reconnectDelay: 2000,
        onConnect: () => {
            setState({ connected: true })
            client.subscribe('/user/queue/room', (msg) => onRoomInfo(JSON.parse(msg.body)))
            client.subscribe('/user/queue/errors', (msg) => onError(JSON.parse(msg.body)))
        },
        onWebSocketClose: () => setState({ connected: false }),
        onStompError: (f) => onError({ code: 'STOMP', message: f.headers.message }),
    })
    client.activate()
    return client
}

export function createRoom(playerId, displayName) {
    client.publish({ destination: '/app/game.create', body: JSON.stringify({ playerId, displayName }) })
}

export function joinRoom(playerId, displayName, roomId) {
    client.publish({ destination: '/app/game.join', body: JSON.stringify({ playerId, displayName, roomId }) })
}

export function sendShot(shot) {
    client.publish({ destination: '/app/game.shoot', body: JSON.stringify(shot) })
}

function onRoomInfo(info) {
    setState({
        roomId: info.roomId,
        myPlayerId: info.playerId,
        mySlot: info.slot,
    })
    if (roomSub) roomSub.unsubscribe()
    roomSub = client.subscribe(`/topic/room/${info.roomId}`, (msg) =>
        onGameState(JSON.parse(msg.body))
    )
    client.publish({
        destination: '/app/game.state',
        body: JSON.stringify({ roomId: info.roomId, playerId: info.playerId }),
    })
}

function onGameState(s) {
    setState({
        phase: s.phase,
        currentTurn: s.currentTurn,
        winner: s.winner,
        turnNumber: s.turnNumber,
        players: {
            P1: { ...s.p1 },
            P2: { ...s.p2 },
        },
    })
}

function onError(err) {
    setState({ error: err })
    setTimeout(() => setState({ error: null }), 4000)
}
