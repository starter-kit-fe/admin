'use client';

import { startSSE } from '@/lib/sse-client';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { JobLogStep, StepEvent } from '../type';

interface UseJobLogStreamOptions {
  jobLogId: number;
  enabled?: boolean;
  onEvent?: (event: StepEvent) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useJobLogStream({
  jobLogId,
  enabled = true,
  onEvent,
  onComplete,
  onError,
}: UseJobLogStreamOptions) {
  const [steps, setSteps] = useState<Map<number, JobLogStep>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const disconnect = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (controllerRef.current) return; // 已经连接

    const controller = new AbortController();
    controllerRef.current = controller;

    startSSE<StepEvent>({
      path: `/v1/monitor/jobs/logs/${jobLogId}/stream`,
      controller,
      onOpen: () => {
        setIsConnected(true);
      },
      onEvent: (eventType, payload) => {
        if (eventType === 'heartbeat') {
          return;
        }

        if (eventType === 'complete') {
          setIsComplete(true);
          onComplete?.();
          disconnect();
          return;
        }

        if (eventType === 'step_start') {
          setSteps((prev) => {
            const next = new Map(prev);
            next.set(payload.stepOrder, {
              stepId: payload.stepId!,
              jobLogId: payload.jobLogId,
              stepName: payload.stepName!,
              stepOrder: payload.stepOrder,
              status: '2',
              output: '',
              startTime: payload.timestamp,
              createdAt: payload.timestamp,
            });
            return next;
          });
        } else if (eventType === 'step_log') {
          setSteps((prev) => {
            const next = new Map(prev);
            const step = next.get(payload.stepOrder);
            if (step) {
              step.output = step.output
                ? `${step.output}\n${payload.output ?? ''}`
                : payload.output || '';
              next.set(payload.stepOrder, { ...step });
            }
            return next;
          });
        } else if (eventType === 'step_end') {
          setSteps((prev) => {
            const next = new Map(prev);
            const step = next.get(payload.stepOrder);
            if (step) {
              step.status = payload.status!;
              step.error = payload.error;
              step.endTime = payload.timestamp;
              step.durationMs = payload.data?.durationMs;
              next.set(payload.stepOrder, { ...step });
            }
            return next;
          });
        }

        onEvent?.(payload);
      },
      onClose: () => {
        setIsConnected(false);
        controllerRef.current = null;
      },
      onError: (error) => {
        setIsConnected(false);
        onError?.(error);
      },
    });
  }, [jobLogId, enabled, onEvent, onComplete, onError, disconnect, isComplete]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  useEffect(() => {
    setSteps(new Map());
    setIsComplete(false);
  }, [jobLogId]);

  return {
    steps: Array.from(steps.values()).sort((a, b) => a.stepOrder - b.stepOrder),
    isConnected,
    isComplete,
    reconnect: connect,
    disconnect,
  };
}
