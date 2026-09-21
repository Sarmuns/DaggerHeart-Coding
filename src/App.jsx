import { useState } from 'react'
import Home from './components/Home'
import PlayerSetup from './components/PlayerSetup'
import Room from './components/Room'
import { savePlayerPreferences } from './utils/playerPreferences'
import { savePlayerStyle } from './utils/playerPreferencesDb'
import './App.css'

function App() {
  const [room, setRoom] = useState(null) // { code, roomId }
  const [player, setPlayer] = useState(null) // { name, color, hopeColor, fearColor, hopeTextColor, fearTextColor, ... }

  function joinRoom(data) {
    setRoom(data)
  }

  function updatePlayer(fields) {
    setPlayer((current) => {
      const newPlayer = { ...current, ...fields }
      savePlayerPreferences(newPlayer)
      savePlayerStyle(newPlayer)
      return newPlayer
    })
  }

  if (!room) {
    return <Home onJoinRoom={joinRoom} />
  }

  if (!player) {
    return <PlayerSetup roomCode={room.code} roomId={room.roomId} onConfirm={setPlayer} />
  }

  return <Room room={room} player={player} onUpdatePlayer={updatePlayer} />
}

export default App
