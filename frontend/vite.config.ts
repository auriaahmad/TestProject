import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { ViteDevServer } from 'vite'
import { WebSocketServer } from 'ws'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function wsServerPlugin(): { name: string; configureServer: (server: ViteDevServer) => void } {
  return {
    name: 'ws-live-seats',
    configureServer() {
      const PORT = 4001

      interface VenueData {
        sections: { rows: { seats: { id: string; status: string }[] }[] }[]
      }

      const venueRaw = readFileSync(resolve(__dirname, 'public/venue.json'), 'utf-8')
      const venue: VenueData = JSON.parse(venueRaw)

      const availableSeats: { id: string; status: string }[] = []
      for (const section of venue.sections) {
        for (const row of section.rows) {
          for (const seat of row.seats) {
            if (seat.status === 'available') availableSeats.push(seat)
          }
        }
      }

      const wss = new WebSocketServer({ port: PORT })
      const clients = new Set<import('ws').WebSocket>()

      wss.on('connection', (ws) => {
        clients.add(ws)
        ws.on('close', () => clients.delete(ws))
      })

      function broadcast(data: unknown) {
        const msg = JSON.stringify(data)
        for (const ws of clients) {
          if (ws.readyState === ws.OPEN) ws.send(msg)
        }
      }

      function simulateChange() {
        if (availableSeats.length === 0) return
        const idx = Math.floor(Math.random() * availableSeats.length)
        const seat = availableSeats[idx]
        const newStatus = Math.random() > 0.5 ? 'held' : 'reserved'

        broadcast({ type: 'seat-update', seatId: seat.id, status: newStatus })

        setTimeout(() => {
          broadcast({ type: 'seat-update', seatId: seat.id, status: 'available' })
        }, 8000 + Math.random() * 7000)

        setTimeout(simulateChange, 5000 + Math.random() * 5000)
      }

      console.log(`WebSocket server running on ws://localhost:${PORT}`)
      simulateChange()
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), wsServerPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
