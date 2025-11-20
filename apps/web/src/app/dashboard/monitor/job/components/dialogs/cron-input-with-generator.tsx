'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import {
    InputGroup,
    InputGroupInput,
    InputGroupButton,
} from '@/components/ui/input-group';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CronHelper } from './cron-helper';

interface CronInputWithGeneratorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export function CronInputWithGenerator({
    value,
    onChange,
    error,
}: CronInputWithGeneratorProps) {
    const [generatorOpen, setGeneratorOpen] = useState(false);

    return (
        <>
            <InputGroup className={`bg-input ${error ? 'border-destructive' : ''}`}>
                <InputGroupInput
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="0 0 2 * * ?"
                    className="font-mono"
                />
                <InputGroupButton
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setGeneratorOpen(true)}
                    aria-label="打开 Cron 生成器"
                >
                    <Calendar className="size-4" />
                </InputGroupButton>
            </InputGroup>

            <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Cron 表达式生成器</DialogTitle>
                        <DialogDescription>
                            可视化配置定时任务的执行规则，生成 Cron 表达式
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto">
                        <CronHelper value={value} onChange={onChange} error={error} />
                    </div>
                    <div className="flex justify-end gap-3 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setGeneratorOpen(false)}
                        >
                            取消
                        </Button>
                        <Button type="button" onClick={() => setGeneratorOpen(false)}>
                            确认使用
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
