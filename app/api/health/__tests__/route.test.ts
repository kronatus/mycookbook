import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';

// Mock the database connection
vi.mock('@/db/connection', () => ({
  checkConnection: vi.fn(),
}));

describe('Health Check API', () => {
  it('should return healthy status when database is connected', async () => {
    const { checkConnection } = await import('@/db/connection');
    vi.mocked(checkConnection).mockResolvedValue({
      success: true,
      message: 'Database connection successful',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.database).toBe('connected');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
  });

  it('should return degraded status when database is disconnected', async () => {
    const { checkConnection } = await import('@/db/connection');
    vi.mocked(checkConnection).mockResolvedValue({
      success: false,
      message: 'Connection failed',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.database).toBe('disconnected');
  });

  it('should handle errors gracefully', async () => {
    const { checkConnection } = await import('@/db/connection');
    vi.mocked(checkConnection).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data).toHaveProperty('error');
  });
});
