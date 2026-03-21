const { execSync } = require('child_process')

try {
  console.log('🔍 Vérification TypeScript...')
  execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: __dirname })
  console.log('✅ TypeScript OK')
} catch (error) {
  console.error('❌ Erreurs TypeScript détectées')
  process.exit(1)
}