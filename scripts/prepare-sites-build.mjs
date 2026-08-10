import { cp, copyFile, mkdir } from 'node:fs/promises'

await mkdir('dist/client', { recursive: true })
await mkdir('dist/server', { recursive: true })
await mkdir('dist/.openai', { recursive: true })
await copyFile('dist/index.html', 'dist/client/index.html')
await copyFile('dist/og.png', 'dist/client/og.png')
await cp('dist/assets', 'dist/client/assets', { recursive: true })
await copyFile('worker/index.js', 'dist/server/index.js')
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json')
