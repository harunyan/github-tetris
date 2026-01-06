import '@testing-library/jest-dom'

// Provide a simple 2D context mock for canvas used during tests
beforeAll(() => {
  const ctx: Partial<CanvasRenderingContext2D> = {
    clearRect: ()=>undefined,
    fillRect: ()=>undefined,
    strokeRect: ()=>undefined,
    beginPath: ()=>undefined,
    moveTo: ()=>undefined,
    lineTo: ()=>undefined,
    stroke: ()=>undefined,
    fillStyle: '',
    strokeStyle: '' as any,
  }
  // @ts-ignore
  HTMLCanvasElement.prototype.getContext = function(){ return ctx }

  // Mock AudioContext for tests
  // @ts-ignore
  if(typeof globalThis.AudioContext === 'undefined'){
    // @ts-ignore
    globalThis.AudioContext = class {
      currentTime = 0
      createOscillator(){
        return { type:'sine', frequency: { setValueAtTime: ()=>{}, exponentialRampToValueAtTime: ()=>{} }, connect: ()=>{}, start: ()=>{}, stop: ()=>{} }
      }
      createGain(){
        return { gain: { setValueAtTime: ()=>{}, exponentialRampToValueAtTime: ()=>{} }, connect: ()=>{} }
      }
    }
  }
})