import React from 'react'
import { render, screen } from '@testing-library/react'
import App from './App'

test('App renders heading', ()=>{
  render(<App />)
  expect(screen.getByText('GitHub Tetris')).toBeInTheDocument()
})
