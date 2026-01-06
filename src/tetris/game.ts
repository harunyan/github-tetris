export type Matrix = number[][]
export type PieceType = 'I'|'J'|'L'|'O'|'S'|'T'|'Z'

export const PIECES: Record<PieceType, { color: string; shape: Matrix }> = {
  I: { color: '#00f0f0', shape: [[1,1,1,1]] },
  J: { color: '#0000f0', shape: [[1,0,0],[1,1,1]] },
  L: { color: '#f0a000', shape: [[0,0,1],[1,1,1]] },
  O: { color: '#f0f000', shape: [[1,1],[1,1]] },
  S: { color: '#00f000', shape: [[0,1,1],[1,1,0]] },
  T: { color: '#a000f0', shape: [[0,1,0],[1,1,1]] },
  Z: { color: '#f00000', shape: [[1,1,0],[0,1,1]] }
}

export function rotate(matrix: Matrix){
  const m = matrix.map(r=>r.slice())
  const N = m.length
  const res = Array.from({length:N},()=>Array(N).fill(0)) as Matrix
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)res[x][N-1-y]=m[y][x]
  return res
}

export function normalizeMatrix(mat: Matrix){
  const h = mat.length, w = mat[0].length
  const n = Math.max(h,w)
  const res = Array.from({length:n},()=>Array(n).fill(0)) as Matrix
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)res[y][x]=mat[y][x]
  return res
}

export function detectFullRows(board: (string|null)[][]){
  const rows: number[] = []
  for(let y=0;y<board.length;y++){
    if(board[y].every(c=>c)) rows.push(y)
  }
  return rows
}

export function removeRows(board: (string|null)[][], rows: number[]){
  rows.sort((a,b)=>b-a)
  for(const y of rows){
    board.splice(y,1)
    board.unshift(Array(board[0].length).fill(null))
  }
  return rows.length
}

export function scoreFor(cleared: number, lvl: number){
  const base = [0,100,300,500,800][cleared] || cleared*1000
  return base * lvl
}
