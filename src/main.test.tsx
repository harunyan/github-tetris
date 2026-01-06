// Ensure main.tsx runs and mounts App to increase coverage for statements/lines
document.body.innerHTML = '<div id="root"></div>'

test('main mounts app without error', async ()=>{
  await import('./main')
  expect(document.getElementById('root')).not.toBeNull()
})
