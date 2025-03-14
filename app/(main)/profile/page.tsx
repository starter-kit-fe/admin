"use client"

import { useState } from 'react'
import { useStore as useAuthStore } from '@/app/auth/store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ProfileHeader } from './_components/profile-header'
import { ProfileForm } from './_components/profile-form'
import { PasswordForm } from './_components/password-form'
import { AccountActivity } from './_components/account-activity'
import { ProfileNotifications } from './_components/profile-notifications'

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("general");

    if (!user) return <div className="py-10 text-center">加载中...</div>;

    return (
        <div className="container max-w-screen-xl py-6 md:py-10 space-y-8">
            <ProfileHeader
                user={user}
                className="px-4 md:px-6"
            />

            <Separator />

            <Tabs
                defaultValue="general"
                value={activeTab}
                onValueChange={setActiveTab}
                className="px-4 md:px-6"
            >
                <div className="flex flex-col md:flex-row gap-8">
                    {/* 左侧导航 */}
                    <div className="md:w-64 shrink-0">
                        <div className="md:sticky md:top-6">
                            <TabsList className="flex flex-row md:flex-col w-full h-auto bg-transparent p-0 gap-2 mb-6 overflow-x-auto md:overflow-visible">
                                <TabsTrigger
                                    value="general"
                                    className="w-full justify-start text-left px-3 py-2 data-[state=active]:bg-primary/10 rounded-md"
                                >
                                    基本信息
                                </TabsTrigger>
                                <TabsTrigger
                                    value="security"
                                    className="w-full justify-start text-left px-3 py-2 data-[state=active]:bg-primary/10 rounded-md"
                                >
                                    安全设置
                                </TabsTrigger>
                                <TabsTrigger
                                    value="activity"
                                    className="w-full justify-start text-left px-3 py-2 data-[state=active]:bg-primary/10 rounded-md"
                                >
                                    账户活动
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notifications"
                                    className="w-full justify-start text-left px-3 py-2 data-[state=active]:bg-primary/10 rounded-md"
                                >
                                    通知设置
                                </TabsTrigger>
                            </TabsList>
                            
                            <div className="hidden md:block bg-muted/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    最近更新于 {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* 右侧内容 */}
                    <div className="flex-1">
                        <TabsContent value="general" className="mt-0 space-y-6">
                            <div className="space-y-0.5">
                                <h2 className="text-2xl font-bold tracking-tight">个人资料</h2>
                                <p className="text-muted-foreground">
                                    管理您的个人资料信息和偏好设置
                                </p>
                            </div>
                            <Separator />
                            <ProfileForm user={user} />
                        </TabsContent>

                        <TabsContent value="security" className="mt-0 space-y-6">
                            <div className="space-y-0.5">
                                <h2 className="text-2xl font-bold tracking-tight">安全设置</h2>
                                <p className="text-muted-foreground">
                                    管理您的密码和账户安全选项
                                </p>
                            </div>
                            <Separator />
                            <PasswordForm />
                        </TabsContent>

                        <TabsContent value="activity" className="mt-0 space-y-6">
                            <div className="space-y-0.5">
                                <h2 className="text-2xl font-bold tracking-tight">账户活动</h2>
                                <p className="text-muted-foreground">
                                    查看您的账户活动历史记录
                                </p>
                            </div>
                            <Separator />
                            <AccountActivity user={user} />
                        </TabsContent>

                        <TabsContent value="notifications" className="mt-0 space-y-6">
                            <div className="space-y-0.5">
                                <h2 className="text-2xl font-bold tracking-tight">通知设置</h2>
                                <p className="text-muted-foreground">
                                    自定义您希望接收的通知类型
                                </p>
                            </div>
                            <Separator />
                            <ProfileNotifications />
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}