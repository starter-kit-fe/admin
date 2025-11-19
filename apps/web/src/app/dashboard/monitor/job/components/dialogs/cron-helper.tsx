'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Calendar } from 'lucide-react';
import {
    CRON_PRESETS,
    describeCron,
    formatDateTime,
    getNextExecutionTimes,
} from '../../utils/cron';

interface CronHelperProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export function CronHelper({ value, onChange, error }: CronHelperProps) {
    const [nextTimes, setNextTimes] = useState<Date[]>([]);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (value) {
            const times = getNextExecutionTimes(value, 3);
            setNextTimes(times);
            setDescription(describeCron(value));
        } else {
            setNextTimes([]);
            setDescription('');
        }
    }, [value]);

    const handlePresetChange = (preset: string) => {
        if (preset === 'custom') {
            return;
        }
        onChange(preset);
    };

    const isPreset = CRON_PRESETS.some((p) => p.value === value);

    return (
        <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <div className="p-4 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex-1 space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">规则配置</Label>
                        <div className="flex gap-2">
                            <Select
                                value={isPreset ? value : 'custom'}
                                onValueChange={handlePresetChange}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="选择预设" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="custom">自定义表达式</SelectItem>
                                    {CRON_PRESETS.map((preset) => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder="0 0 2 * * ?"
                                className={`font-mono flex-1 ${error ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            💡 格式: 秒 分 时 日 月 周 (例如: 0 0 2 * * ? 表示每天凌晨2点)
                        </p>
                    </div>
                </div>

                {(description || nextTimes.length > 0) && (
                    <div className="rounded-md bg-muted/50 p-3 space-y-3">
                        {description && (
                            <div className="flex items-start gap-2 text-sm">
                                <Clock className="h-4 w-4 mt-0.5 text-blue-500" />
                                <div>
                                    <span className="font-medium text-foreground">执行规则: </span>
                                    <span className="text-muted-foreground">{description}</span>
                                </div>
                            </div>
                        )}

                        {nextTimes.length > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                                <Calendar className="h-4 w-4 mt-0.5 text-green-500" />
                                <div>
                                    <span className="font-medium text-foreground">下次执行: </span>
                                    <div className="mt-1 space-y-1">
                                        {nextTimes.map((time, index) => (
                                            <div key={index} className="text-muted-foreground font-mono text-xs">
                                                {formatDateTime(time)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
