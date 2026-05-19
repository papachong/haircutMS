'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export interface DashboardSocketEvents {
  'dashboard:metrics-update': (data: { reason: string; timestamp: string }) => void;
  'dashboard:new-order': (data: { orderId: string; orderNo: string; timestamp: string }) => void;
  'dashboard:member-recharge': (data: {
    memberId: string;
    memberName: string;
    amount: number;
    timestamp: string;
  }) => void;
  'dashboard:stats-update': (data: { timestamp: string }) => void;
  'dashboard:connected': (data: { shopId: string; timestamp: string }) => void;
}

interface UseDashboardSocketOptions {
  onMetricsUpdate?: DashboardSocketEvents['dashboard:metrics-update'];
  onNewOrder?: DashboardSocketEvents['dashboard:new-order'];
  onMemberRecharge?: DashboardSocketEvents['dashboard:member-recharge'];
  onStatsUpdate?: DashboardSocketEvents['dashboard:stats-update'];
  enabled?: boolean;
}

interface UseDashboardSocketReturn {
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
}

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useDashboardSocket(
  options: UseDashboardSocketOptions = {},
): UseDashboardSocketReturn {
  const {
    onMetricsUpdate,
    onNewOrder,
    onMemberRecharge,
    onStatsUpdate,
    enabled = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    enabled ? 'connecting' : 'disconnected',
  );

  const stableCallbacks = useRef({
    onMetricsUpdate,
    onNewOrder,
    onMemberRecharge,
    onStatsUpdate,
  });
  stableCallbacks.current = {
    onMetricsUpdate,
    onNewOrder,
    onMemberRecharge,
    onStatsUpdate,
  };

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    disconnect();

    setConnectionStatus('connecting');

    const socket = io(`${SOCKET_SERVER_URL}/dashboard`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      reconnectAttemptsRef.current = 0;
      setConnectionStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      setConnectionStatus('disconnected');

      if (reason === 'io server disconnect') {
        return;
      }

      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        const delay = RECONNECT_DELAY_MS * reconnectAttemptsRef.current;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, Math.min(delay, 30000));
      }
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');

      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        const delay = RECONNECT_DELAY_MS * reconnectAttemptsRef.current;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, Math.min(delay, 30000));
      }
    });

    socket.on('dashboard:metrics-update', (data) => {
      stableCallbacks.current.onMetricsUpdate?.(data);
    });

    socket.on('dashboard:new-order', (data) => {
      stableCallbacks.current.onNewOrder?.(data);
    });

    socket.on('dashboard:member-recharge', (data) => {
      stableCallbacks.current.onMemberRecharge?.(data);
    });

    socket.on('dashboard:stats-update', (data) => {
      stableCallbacks.current.onStatsUpdate?.(data);
    });
  }, [enabled, disconnect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return {
    connectionStatus,
    reconnect,
  };
}
