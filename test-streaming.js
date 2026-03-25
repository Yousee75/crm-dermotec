// Test streaming format compatibility
console.log('Testing AI SDK v6 toUIMessageStreamResponse format...')

// Mock du client side parsing
function parseSSEChunk(line) {
  if (!line.startsWith('data: ') || line === 'data: [DONE]') {
    return null
  }

  try {
    const chunk = JSON.parse(line.slice(6))
    console.log('Parsed chunk:', chunk)

    // Le client cherche chunk.type === 'text-delta'
    if (chunk.type === 'text-delta' && chunk.delta) {
      return chunk.delta
    }

    // Format AI SDK v6 potentiel
    if (chunk.type === 'text' && chunk.content) {
      return chunk.content
    }

    return null
  } catch (e) {
    console.error('Parse error:', e)
    return null
  }
}

// Test avec différents formats
const testChunks = [
  'data: {"type":"text-delta","delta":"Hello"}',
  'data: {"type":"text","content":"Hello"}',
  'data: {"type":"message","message":"Hello"}',
  'data: {"id":"123","type":"text-delta","delta":" world"}',
  'data: [DONE]'
]

testChunks.forEach((chunk, i) => {
  console.log(`\nTest ${i+1}: ${chunk}`)
  const result = parseSSEChunk(chunk)
  console.log('Result:', result)
})