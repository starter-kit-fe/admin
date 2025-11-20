'use client';

import { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJobLogStream } from '../../hooks/use-job-log-stream';
import type { JobLogStep } from '../../type';

interface RealtimeLogViewerProps {
    jobLogId: number;
    jobName: string;
    onComplete?: () => void;
}

export function RealtimeLogViewer({
    jobLogId,
    jobName,
    onComplete,
}: RealtimeLogViewerProps) {
    const { steps, isConnected, isComplete } = useJobLogStream({
        jobLogId,
        onComplete,
    });

    const allSuccess = steps.every((s) => s.status === '0');
    const hasError = steps.some((s) => s.status === '1');

    return (
        <div className={cn(
            "rounded-lg border bg-card",
            !isComplete && "border-sky-200 shadow-sm animate-[pulse_2s_ease-in-out_infinite]"
        )}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
                {isComplete ? (
                    allSuccess ? (
                        <CheckCircle2 className="size-5 text-emerald-600" />
                    ) : (
                        <XCircle className="size-5 text-rose-600" />
                    )
                ) : (
                    <Loader2 className="size-5 text-blue-600 animate-spin" />
                )}

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{jobName}</span>
                        <Badge
                            variant={
                                isComplete
                                    ? allSuccess
                                        ? 'secondary'
                                        : 'destructive'
                                    : 'outline'
                            }
                        >
                            {isComplete ? (allSuccess ? '成功' : '失败') : '执行中'}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {isConnected
                            ? '实时日志推送中...'
                            : isComplete
                                ? '任务已完成'
                                : '连接已断开'}
                    </p>
                </div>

                <div className="text-xs text-muted-foreground">
                    {steps.length} 个步骤
                </div>
            </div>

            {/* Steps */}
            <ScrollArea className="max-h-[600px]">
                <div className="p-2">
                    {steps.map((step, index) => (
                        <StepItem
                            key={step.stepId}
                            step={step}
                            isLast={index === steps.length - 1}
                        />
                    ))}

                    {steps.length === 0 && !isComplete && (
                        <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin mr-2" />
                            等待任务开始...
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function StepItem({
    step,
    isLast,
}: {
    step: JobLogStep;
    isLast: boolean;
}) {
    const [expanded, setExpanded] = useState(true);
    const isRunning = step.status === '2';
    const isSuccess = step.status === '0';
    const isFailed = step.status === '1';

    return (
        <div
            className={cn(
                'relative',
                !isLast && 'pb-4',
                !isLast && 'border-l-2 border-border ml-5'
            )}
        >
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative">
                    {isRunning ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <Loader2 className="size-4 text-blue-600 animate-spin" />
                        </div>
                    ) : isSuccess ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                        </div>
                    ) : isFailed ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                            <XCircle className="size-4 text-rose-600" />
                        </div>
                    ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                            <Clock className="size-4 text-muted-foreground" />
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex-1 text-left"
                >
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                            步骤 {step.stepOrder}: {step.stepName}
                        </span>
                        {step.durationMs !== undefined && (
                            <span className="text-xs text-muted-foreground">
                                ({formatDuration(step.durationMs)})
                            </span>
                        )}
                        {step.output && (
                            <span className="text-xs text-muted-foreground">
                                {expanded ? (
                                    <ChevronDown className="size-3" />
                                ) : (
                                    <ChevronRight className="size-3" />
                                )}
                            </span>
                        )}
                    </div>
                </button>
            </div>

            {/* Output */}
            {expanded && step.output && (
                <div className="ml-11 mr-3 mb-2">
                    <pre className="rounded-md bg-muted/50 border p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-thin">
                        {step.output}
                    </pre>
                </div>
            )}

            {/* Error */}
            {step.error && (
                <div className="ml-11 mr-3 mb-2">
                    <pre className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive whitespace-pre-wrap">
                        {step.error}
                    </pre>
                </div>
            )}
        </div>
    );
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
}
