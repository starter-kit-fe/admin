"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { CalendarIcon, Clock1 } from "lucide-react"
import { type userInfoResponse } from '@/api'
interface AccountActivityProps {
    user: userInfoResponse
}

export function AccountActivity({ user }: AccountActivityProps) {
    // 格式化日期时间
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date)
    }

    // 模拟一些账户活动数据
    const activities = [
        {
            id: 1,
            type: "account_created",
            description: "账户创建",
            ip: "114.88.xxx.xxx",
            device: "Chrome on Windows",
            date: user.createdAt
        },
        {
            id: 2,
            type: "profile_updated",
            description: "个人资料更新",
            ip: "114.88.xxx.xxx",
            device: "Chrome on Windows",
            date: user.updatedAt
        },
        // 这里可以添加更多活动记录
    ]

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Clock1 className="mr-2 size-5" />
                        账户活动记录
                    </CardTitle>
                    <CardDescription>
                        您的账户活动和操作记录
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableCaption>账户活动历史记录</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>活动类型</TableHead>
                                <TableHead>时间</TableHead>
                                <TableHead className="hidden md:table-cell">IP地址</TableHead>
                                <TableHead className="hidden md:table-cell">设备信息</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activities.map((activity) => (
                                <TableRow key={activity.id}>
                                    <TableCell className="font-medium">{activity.description}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="size-3.5 text-muted-foreground" />
                                            <span>{formatDateTime(activity.date)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{activity.ip}</TableCell>
                                    <TableCell className="hidden md:table-cell">{activity.device}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>账户时间线</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-8">
                        <div className="flex">
                            <div className="flex flex-col items-center mr-4">
                                <div className="flex items-center justify-center size-8 rounded-full border-4 border-primary bg-background">
                                    <div className="size-2 rounded-full bg-primary" />
                                </div>
                                <div className="w-px h-full bg-muted" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">账户创建</p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(user.createdAt)}</p>
                                <p className="mt-2 text-sm">您的账户已成功创建</p>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="flex flex-col items-center mr-4">
                                <div className="flex items-center justify-center size-8 rounded-full border-4 border-primary bg-background">
                                    <div className="size-2 rounded-full bg-primary" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium">资料更新</p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(user.updatedAt)}</p>
                                <p className="mt-2 text-sm">您的个人资料已更新</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
