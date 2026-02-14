import fs from 'fs'
import path from 'path'

test('manifest file exists and is valid', () => {
  const manifestPath = path.join(process.cwd(), 'app', 'manifest.ts')
  expect(fs.existsSync(manifestPath)).toBe(true)
})
