import { test, expect, describe } from 'bun:test'
import request from 'supertest'
import express from 'express'
import healthRouter from '../../../routes/v1/health.router'

describe('Health Router', () => {
  // Setup test app
  const app = express()
  app.use(express.json())
  app.use('/api/v1', healthRouter)

  describe('GET /api/v1/health', () => {
    test('should return status ok when server is healthy', async () => {
      const response = await request(app).get('/api/v1/health').expect(200)

      expect(response.body).toEqual({
        status: 'ok',
      })
    })

    test('should return JSON content type', async () => {
      const response = await request(app).get('/api/v1/health').expect(200)

      expect(response.headers['content-type']).toMatch(/json/)
    })

    test('should handle health check quickly (under 100ms)', async () => {
      const startTime = Date.now()

      await request(app).get('/api/v1/health').expect(200)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)
    })
  })

  describe('Health Router Edge Cases', () => {
    test('should return 404 for non-existent routes', async () => {
      await request(app).get('/api/v1/healthz').expect(404)
    })

    test('should not accept POST requests on health endpoint', async () => {
      await request(app).post('/api/v1/health').expect(404)
    })

    test('should not accept PUT requests on health endpoint', async () => {
      await request(app).put('/api/v1/health').expect(404)
    })

    test('should not accept DELETE requests on health endpoint', async () => {
      await request(app).delete('/api/v1/health').expect(404)
    })
  })
})
