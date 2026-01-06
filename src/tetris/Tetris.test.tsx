import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Tetris from './Tetris'

describe('Tetris component', ()=>{
  test('renders UI and responds to hard drop increasing score', async ()=>{
    render(<Tetris />)
    const scoreEl = await screen.findByText(/Score:/)
    expect(scoreEl).toBeInTheDocument()
    const initial = screen.getByText(/Score:/).textContent

    // trigger hard drop (space)
    fireEvent.keyDown(window, { key: ' ' })

    // after hard drop score should increase (hard drop gives points)
    await waitFor(()=>{
      const s = screen.getByText(/Score:/).textContent
      expect(s).not.toBe(initial)
    })
  })
})