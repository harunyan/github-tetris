import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Tetris from './Tetris'

describe('Tetris interactions', ()=>{
  test('soft drop increases score', async ()=>{
    render(<Tetris />)
    const scoreEl = await screen.findByText(/Score:/)
    const initial = scoreEl.textContent
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    await waitFor(()=>{
      expect(screen.getByText(/Score:/).textContent).not.toBe(initial)
    })
  })

  test('hold toggles hold area', async ()=>{
    render(<Tetris />)
    // initially hold shows ---
    expect(await screen.findByText('---')).toBeInTheDocument()
    // press C to hold current piece
    fireEvent.keyDown(window, { key: 'c' })
    // after hold, --- should be replaced by a piece letter
    await waitFor(()=>{
      expect(screen.queryByText('---')).not.toBeInTheDocument()
    })
  })

  test('rotate and move keys do not crash', async ()=>{
    render(<Tetris />)
    fireEvent.keyDown(window, { key: 'x' })
    fireEvent.keyDown(window, { key: 'z' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    // just ensure component still mounted
    expect(await screen.findByText(/Score:/)).toBeInTheDocument()
  })
})
