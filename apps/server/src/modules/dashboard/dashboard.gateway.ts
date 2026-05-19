import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

interface JwtPayload {
  staffId: string;
  shopId: string;
  role: string;
  type: string;
}

export interface DashboardEvent {
  type: 'metrics-update' | 'new-order' | 'member-recharge' | 'stats-update';
  shopId: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://your-domain.com']
      : ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/dashboard',
  transports: ['websocket', 'polling'],
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);
  private readonly rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  private static readonly RATE_LIMIT_WINDOW_MS = 10_000;
  private static readonly RATE_LIMIT_MAX_EVENTS = 20;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no token provided`);
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);

      if (!payload.shopId || !payload.staffId) {
        this.logger.warn(`Client ${client.id} rejected: invalid token payload`);
        client.disconnect(true);
        return;
      }

      const roomName = `shop:${payload.shopId}`;
      client.join(roomName);
      client.data.shopId = payload.shopId;
      client.data.staffId = payload.staffId;
      client.data.role = payload.role;

      this.logger.log(
        `Client ${client.id} connected to room ${roomName} (staff: ${payload.staffId})`,
      );

      client.emit('dashboard:connected', {
        shopId: payload.shopId,
        timestamp: new Date().toISOString(),
      });
    } catch {
      this.logger.warn(`Client ${client.id} rejected: token verification failed`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    if (client.data.shopId) {
      this.logger.log(
        `Client ${client.id} disconnected from shop:${client.data.shopId}`,
      );
    }
    this.rateLimitMap.delete(client.id);
  }

  emitToShop(shopId: string, event: DashboardEvent): void {
    const now = Date.now();
    const key = `${shopId}:${event.type}`;
    const limiter = this.rateLimitMap.get(key);

    if (limiter && now < limiter.resetAt) {
      if (limiter.count >= DashboardGateway.RATE_LIMIT_MAX_EVENTS) {
        this.logger.warn(`Rate limiting event ${key} for shop ${shopId}`);
        return;
      }
      limiter.count += 1;
    } else {
      this.rateLimitMap.set(key, {
        count: 1,
        resetAt: now + DashboardGateway.RATE_LIMIT_WINDOW_MS,
      });
    }

    const roomName = `shop:${shopId}`;
    this.server.to(roomName).emit(`dashboard:${event.type}`, {
      ...event.payload,
      timestamp: event.timestamp.toISOString(),
    });
  }

  emitGlobalMetricsUpdate(shopId: string): void {
    this.emitToShop(shopId, {
      type: 'metrics-update',
      shopId,
      payload: { reason: 'data-changed' },
      timestamp: new Date(),
    });
  }

  emitNewOrder(shopId: string, orderId: string, orderNo: string): void {
    this.emitToShop(shopId, {
      type: 'new-order',
      shopId,
      payload: { orderId, orderNo },
      timestamp: new Date(),
    });
  }

  emitMemberRecharge(shopId: string, memberId: string, memberName: string, amount: number): void {
    this.emitToShop(shopId, {
      type: 'member-recharge',
      shopId,
      payload: { memberId, memberName, amount },
      timestamp: new Date(),
    });
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth;
    if (auth?.token) {
      return auth.token as string;
    }

    const query = client.handshake.query;
    if (query?.token && typeof query.token === 'string') {
      return query.token;
    }

    const headers = client.handshake.headers;
    if (headers.authorization) {
      const parts = headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
    }

    return null;
  }
}
