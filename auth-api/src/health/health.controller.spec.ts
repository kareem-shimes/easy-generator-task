import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { ConnectionStates } from 'mongoose';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let mockConnection: { readyState: ConnectionStates };

  beforeEach(async () => {
    mockConnection = {
      readyState: ConnectionStates.connected,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return complete health status with all required fields', () => {
      mockConnection.readyState = ConnectionStates.connected;

      const result = controller.check();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('database', 'connected');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return timestamp in valid ISO format', () => {
      const beforeTime = new Date();
      const result = controller.check();
      const afterTime = new Date();

      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
      const resultTime = new Date(result.timestamp);
      expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should correctly map all connection states to database status', () => {
      const states = [
        { state: ConnectionStates.disconnected, expected: 'disconnected' },
        { state: ConnectionStates.connected, expected: 'connected' },
        { state: ConnectionStates.connecting, expected: 'disconnected' },
        { state: ConnectionStates.disconnecting, expected: 'disconnected' },
        { state: ConnectionStates.uninitialized, expected: 'disconnected' },
      ];

      states.forEach(({ state, expected }) => {
        mockConnection.readyState = state;
        const result = controller.check();
        expect(result.database).toBe(expected);
        expect(result.status).toBe('ok');
      });
    });
  });
});
