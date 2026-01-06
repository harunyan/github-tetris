import React, { useEffect, useRef, useState } from 'react'

// Board size
const COLS = 10
const ROWS = 20
const BLOCK = 24 // px

type PieceType = 'I'|'J'|'L'|'O'|'S'|'T'|'Z'

type Matrix = number[][]

type Piece = {
  type: PieceType
  color: string
  shape: Matrix
  matrix: Matrix
}

const PIECES: Record<PieceType, { color: string; shape: Matrix }> = {
  I: { color: '#00f0f0', shape: [[1,1,1,1]] },
  J: { color: '#0000f0', shape: [[1,0,0],[1,1,1]] },
  L: { color: '#f0a000', shape: [[0,0,1],[1,1,1]] },
  O: { color: '#f0f000', shape: [[1,1],[1,1]] },
  S: { color: '#00f000', shape: [[0,1,1],[1,1,0]] },
  T: { color: '#a000f0', shape: [[0,1,0],[1,1,1]] },
  Z: { color: '#f00000', shape: [[1,1,0],[0,1,1]] }
}

function rndPiece(): Piece {
  const keys = Object.keys(PIECES) as PieceType[]
  const k = keys[Math.floor(Math.random()*keys.length)]
  return { type: k, ...PIECES[k], matrix: PIECES[k].shape.map(r=>r.slice()) }
}

function rotate(matrix: Matrix): Matrix{
  const m = matrix.map(r=>r.slice())
  const N = m.length
  const res = Array.from({length:N},()=>Array(N).fill(0)) as Matrix
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)res[x][N-1-y]=m[y][x]
  return res
}

export default function Tetris(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement|null>(null)
  const [running] = useState(true)
  const ctxRef = useRef<CanvasRenderingContext2D|null>(null)
  const boardRef = useRef<(string|null)[][]>(createEmptyBoard())
  const pieceRef = useRef<Piece|null>(null)
  const posRef = useRef({x:3,y:0})
  const queueRef = useRef<Piece[]>([])
  const holdRef = useRef<Piece|null>(null)
  const canHoldRef = useRef(true)
  const scoreRef = useRef(0)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const lastDropTime = useRef(Date.now())
  const dropInterval = useRef(1000)

  // animation / sound refs
  const isClearingRef = useRef(false)
  const clearRowsRef = useRef<number[]>([])
  const clearStartRef = useRef(0)
  const CLEAR_DURATION = 350 // ms

  // WebAudio helper
  const audioCtxRef = useRef<AudioContext|null>(null)
  function ensureAudio(){ if(!audioCtxRef.current){ audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)() } }
  function playSound(type: 'land'|'clear'){
    ensureAudio()
    const ctx = audioCtxRef.current!
    const now = ctx.currentTime
    if(type==='land'){
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.type='square'; o.frequency.setValueAtTime(140, now)
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.12, now+0.01); g.gain.exponentialRampToValueAtTime(0.0001, now+0.18)
      o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now+0.2)
    } else if(type==='clear'){
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.type='sine'; o.frequency.setValueAtTime(550, now); o.frequency.exponentialRampToValueAtTime(200, now+0.2)
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.14, now+0.01); g.gain.exponentialRampToValueAtTime(0.0001, now+0.25)
      o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now+0.25)
    }
  }

  useEffect(()=>{
    const canvas = canvasRef.current!
    canvas.width = COLS*BLOCK
    canvas.height = ROWS*BLOCK
    ctxRef.current = canvas.getContext('2d')

    // init queue
    for(let i=0;i<5;i++) queueRef.current.push(rndPiece())
    spawnPiece()

    const onKey = (e: KeyboardEvent)=>{
      if(!running) return
      if(e.key==='ArrowLeft') move(-1)
      else if(e.key==='ArrowRight') move(1)
      else if(e.key==='ArrowDown') softDrop()
      else if(e.key===' ') hardDrop()
      else if(e.key==='z' || e.key==='Z') rotatePiece(-1)
      else if(e.key==='x' || e.key==='X') rotatePiece(1)
      else if(e.key==='c' || e.key==='C') hold()
    }
    window.addEventListener('keydown', onKey)

    let rafId = 0
    const loop = ()=>{
      const now = Date.now()
      const dt = now - lastDropTime.current
      if(!isClearingRef.current && dt > dropInterval.current){
        step()
        lastDropTime.current = now
      }
      draw()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return ()=>{ window.removeEventListener('keydown', onKey); cancelAnimationFrame(rafId) }
  }, [])

  function createEmptyBoard(){
    return Array.from({length:ROWS},()=>Array(COLS).fill(null))
  }

  function spawnPiece(){
    const p = queueRef.current.shift()!
    queueRef.current.push(rndPiece())
    pieceRef.current = { ...p, matrix: normalizeMatrix(p.matrix) }
    posRef.current = { x: Math.floor((COLS - pieceRef.current.matrix[0].length)/2), y: 0 }
    canHoldRef.current = true
    if(collide(boardRef.current, pieceRef.current.matrix, posRef.current)){
      // game over: reset
      boardRef.current = createEmptyBoard()
      scoreRef.current = 0
      setScore(0)
      setLines(0)
      setLevel(1)
      dropInterval.current = 1000
    }
  }

  function normalizeMatrix(mat: Matrix){
    // make square matrix for rotation
    const h = mat.length, w = mat[0].length
    const n = Math.max(h,w)
    const res = Array.from({length:n},()=>Array(n).fill(0)) as Matrix
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)res[y][x]=mat[y][x]
    return res
  }

  function collide(board: (string|null)[][], matrix: Matrix, pos: {x:number,y:number}){
    for(let y=0;y<matrix.length;y++)for(let x=0;x<matrix[y].length;x++){
      if(matrix[y][x]){
        const bx = x + pos.x
        const by = y + pos.y
        if(bx<0 || bx>=COLS || by>=ROWS) return true
        if(by>=0 && board[by][bx]) return true
      }
    }
    return false
  }

  function merge(board: (string|null)[][], matrix: Matrix, pos: {x:number,y:number}, color: string){
    for(let y=0;y<matrix.length;y++)for(let x=0;x<matrix[y].length;x++){
      if(matrix[y][x]){
        const bx = x + pos.x
        const by = y + pos.y
        if(by>=0 && by<ROWS && bx>=0 && bx<COLS) board[by][bx] = color
      }
    }
  }

  function step(){
    if(!pieceRef.current) return
    posRef.current.y +=1
    if(collide(boardRef.current, pieceRef.current.matrix, posRef.current)){
      posRef.current.y -=1
      // lock
      merge(boardRef.current, pieceRef.current.matrix, posRef.current, pieceRef.current.color)
      playSound('land')
      const fullRows = detectFullRows()
      if(fullRows.length>0){
        startClear(fullRows)
      } else {
        spawnPiece()
      }
    }
  }

  function detectFullRows(){
    const rows: number[] = []
    for(let y=0;y<ROWS;y++){
      if(boardRef.current[y].every(c=>c)) rows.push(y)
    }
    return rows
  }

  function removeRows(rows: number[]){
    rows.sort((a,b)=>b-a)
    for(const y of rows){
      boardRef.current.splice(y,1)
      boardRef.current.unshift(Array(COLS).fill(null))
    }
    return rows.length
  }

  function startClear(rows: number[]){
    isClearingRef.current = true
    clearRowsRef.current = rows
    clearStartRef.current = Date.now()
    playSound('clear')
    setTimeout(()=> {
      const cleared = removeRows(rows)
      if(cleared>0){
        const points = scoreFor(cleared, level)
        scoreRef.current += points
        setScore(scoreRef.current)
        setLines(l=>{
          const nl = l+cleared
          const newLevel = Math.floor(nl/10)+1
          setLevel(newLevel)
          dropInterval.current = Math.max(100, 1000 - (newLevel-1)*100)
          return nl
        })
      }
      isClearingRef.current = false
      clearRowsRef.current = []
      spawnPiece()
    }, CLEAR_DURATION)
  }

  function scoreFor(cleared: number, lvl: number){
    const base = [0,100,300,500,800][cleared] || cleared*1000
    return base * lvl
  }

  function move(dir: number){
    if(!pieceRef.current) return
    posRef.current.x += dir
    if(collide(boardRef.current, pieceRef.current.matrix, posRef.current)) posRef.current.x -= dir
  }

  function softDrop(){
    if(!pieceRef.current) return
    posRef.current.y +=1
    if(collide(boardRef.current, pieceRef.current.matrix, posRef.current)){
      posRef.current.y -=1
    } else {
      // small score for soft drop
      scoreRef.current +=1
      setScore(scoreRef.current)
    }
  }

  function hardDrop(){
    if(!pieceRef.current) return
    while(!collide(boardRef.current, pieceRef.current.matrix, {x:posRef.current.x, y:posRef.current.y+1})){
      posRef.current.y +=1
      scoreRef.current +=2
    }
    setScore(scoreRef.current)
    step() // will lock
    lastDropTime.current = Date.now()
  }

  function rotatePiece(dir: number){
    if(!pieceRef.current) return
    const old = pieceRef.current.matrix
    const rotated = dir>0 ? rotate(old) : rotate(rotate(rotate(old)))
    const kicks = [0, -1, 1, -2, 2]
    for(let i=0;i<kicks.length;i++){
      posRef.current.x += kicks[i]
      if(!collide(boardRef.current, rotated, posRef.current)){
        pieceRef.current.matrix = rotated
        return
      }
      posRef.current.x -= kicks[i]
    }
  }

  function hold(){
    if(!pieceRef.current || !canHoldRef.current) return
    const current = pieceRef.current
    if(!holdRef.current){
      holdRef.current = {...current}
      spawnPiece()
    } else {
      const tmp = holdRef.current
      holdRef.current = {...current}
      pieceRef.current = {...tmp, matrix: normalizeMatrix(tmp.matrix)}
      posRef.current = { x: Math.floor((COLS - pieceRef.current.matrix[0].length)/2), y: 0 }
    }
    canHoldRef.current = false
  }

  function ghostPos(){
    if(!pieceRef.current) return 0
    let y = posRef.current.y
    while(!collide(boardRef.current, pieceRef.current.matrix, {x:posRef.current.x, y:y+1})) y++
    return y
  }

  function draw(){
    const ctx = ctxRef.current!
    ctx.clearRect(0,0, COLS*BLOCK, ROWS*BLOCK)

    // draw board
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const c = boardRef.current[y][x]
      drawCell(ctx, x, y, c)
    }

    // clear animation overlay
    if(isClearingRef.current){
      const t = Date.now()
      const p = Math.min(1, (t - clearStartRef.current)/CLEAR_DURATION)
      const alpha = Math.abs(Math.sin(p*Math.PI*3)) * 0.9
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      for(const y of clearRowsRef.current){
        ctx.fillRect(1, y*BLOCK+1, COLS*BLOCK-2, BLOCK-2)
      }
    }

    // ghost
    const gY = ghostPos()
    if(pieceRef.current) drawMatrix(ctx, pieceRef.current.matrix, posRef.current.x, gY, 'rgba(255,255,255,0.08)')

    // active piece
    if(pieceRef.current) drawMatrix(ctx, pieceRef.current.matrix, posRef.current.x, posRef.current.y, pieceRef.current.color)
  }

  function drawMatrix(ctx: CanvasRenderingContext2D, matrix: Matrix, ox: number, oy: number, color?: string){
    for(let y=0;y<matrix.length;y++)for(let x=0;x<matrix[y].length;x++){
      if(matrix[y][x]) drawCell(ctx, ox+x, oy+y, color)
    }
  }

  function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, color?: string | null){
    const sx = x*BLOCK, sy = y*BLOCK
    ctx.fillStyle = color || '#222'
    ctx.fillRect(sx+1, sy+1, BLOCK-2, BLOCK-2)
    if(color){
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'
      ctx.strokeRect(sx+1, sy+1, BLOCK-2, BLOCK-2)
    }
  }

  return (
    <div className="tetris-wrapper">
      <div className="canvas-panel">
        <canvas className="game-canvas" ref={canvasRef} />
      </div>
      <div className="side-panel">
        <div className="panel-block">
          <div>Score: <strong>{score}</strong></div>
          <div>Lines: <strong>{lines}</strong></div>
          <div>Level: <strong>{level}</strong></div>
        </div>
        <div className="panel-block">
          <div className="small">Next</div>
          <div style={{display:'flex',gap:6,marginTop:8}}>
            {queueRef.current.slice(0,3).map((p,i)=> (
              <div key={i} style={{width:48,height:48,background:'#000',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:4}}>
                <span style={{color:p.color,fontWeight:700}}>{p.type}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-block">
          <div className="small">Hold</div>
          <div style={{width:72,height:72,marginTop:8,display:'flex',alignItems:'center',justifyContent:'center',background:'#000',borderRadius:6}}>
            {holdRef.current ? <span style={{color:holdRef.current.color}}>{holdRef.current.type}</span> : <span className="small">---</span>}
          </div>
        </div>
        <div className="panel-block controls">
          <div><strong>Controls</strong></div>
          <div>Move: ← →</div>
          <div>Rotate: Z / X</div>
          <div>Soft drop: ↓</div>
          <div>Hard drop: Space</div>
          <div>Hold: C</div>
        </div>
      </div>
    </div>
  )
}
