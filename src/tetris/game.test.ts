import { rotate, normalizeMatrix, scoreFor, detectFullRows, removeRows, PIECES } from './game'

describe('game util functions', ()=>{
  test('rotate 2x2', ()=>{
    const m = [[1,2],[3,4]]
    expect(rotate(m)).toEqual([[3,1],[4,2]])
  })

  test('normalizeMatrix makes square', ()=>{
    const m = [[1,1,1]]
    expect(normalizeMatrix(m)).toEqual([[1,1,1],[0,0,0],[0,0,0]])
  })

  test('scoreFor values', ()=>{
    expect(scoreFor(1,1)).toBe(100)
    expect(scoreFor(4,2)).toBe(800*2)
  })

  test('detect and remove rows', ()=>{
    const board = [
      [null,null,null],
      ['a','b','c'],
      ['d','e','f']
    ]
    expect(detectFullRows(board)).toEqual([1,2])
    const removed = removeRows(board, [1,2])
    expect(removed).toBe(2)
    expect(board.length).toBe(3)
    expect(board[0]).toEqual([null,null,null])
  })

  test('PIECES contains 7 types', ()=>{
    expect(Object.keys(PIECES).length).toBe(7)
  })
})