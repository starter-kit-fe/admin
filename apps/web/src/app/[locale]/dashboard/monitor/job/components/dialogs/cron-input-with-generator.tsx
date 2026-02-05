'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import {
    InputGroup,
    InputGroupInput,
    InputGroupButton,
} from '@/components/ui/input-group';
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
                    placeholder="0 2 * * *"
                    className="font-mono cursor-text"
                />
                <InputGroupButton
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer"
                    onClick={() => setGeneratorOpen(true)}
                    aria-label="打开 Cron 生成器"
                >
                    <Calendar className="size-4" />
                </InputGroupButton>
            </InputGroup>

            <CronHelper
                value={value}
                onChange={onChange}
                error={error}
                open={generatorOpen}
                onOpenChange={setGeneratorOpen}
            />
        </>
    );
}
