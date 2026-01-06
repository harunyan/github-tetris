import React from 'react'
import Tetris from './tetris/Tetris'

export default function App(): JSX.Element {
  return (
    <div className="app-root">
      <h1>GitHub Tetris</h1>
      <Tetris />
    </div>
  )
}
