"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Mail, MessageSquare, Smartphone, Globe, Megaphone, Calendar, AlertCircle } from "lucide-react"

export function ProfileNotifications() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    security: true,
    updates: true,
    marketing: false,
    events: true,
    announcements: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSubmit = () => {
    setIsSubmitting(true)

    // 模拟API请求
    setTimeout(() => {
    //   toast({
    //     title: "通知设置已更新",
    //     description: "您的通知偏好设置已成功保存"
    //   })
      setIsSubmitting(false)
    }, 1000)
  }

  const notificationCategories = [
    {
      id: "communication",
      title: "通讯通知",
      description: "与消息、评论和回复相关的通知",
      items: [
        { id: "email", label: "电子邮件通知", icon: <Mail className="size-4" />, state: notifications.email },
        { id: "push", label: "推送通知", icon: <Bell className="size-4" />, state: notifications.push },
        { id: "sms", label: "短信通知", icon: <Smartphone className="size-4" />, state: notifications.sms },
      ],
    },
    {
      id: "account",
      title: "账户通知",
      description: "与您的账户安全和更新相关的通知",
      items: [
        { id: "security", label: "安全提醒", icon: <AlertCircle className="size-4" />, state: notifications.security },
        { id: "updates", label: "产品更新", icon: <Globe className="size-4" />, state: notifications.updates },
        { id: "marketing", label: "营销消息", icon: <Megaphone className="size-4" />, state: notifications.marketing },
      ],
    },
    {
      id: "content",
      title: "内容通知",
      description: "与系统内容和活动相关的通知",
      items: [
        { id: "events", label: "活动提醒", icon: <Calendar className="size-4" />, state: notifications.events },
        { id: "announcements", label: "系统公告", icon: <MessageSquare className="size-4" />, state: notifications.announcements },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {notificationCategories.map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle>{category.title}</CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {category.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    {item.icon}
                  </div>
                  <Label htmlFor={item.id} className="flex-grow">{item.label}</Label>
                </div>
                <Switch 
                  id={item.id} 
                  checked={item.state} 
                  onCheckedChange={() => handleToggle(item.id as keyof typeof notifications)} 
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>通知频率</CardTitle>
          <CardDescription>设置您希望接收通知的频率</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="font-medium mb-1">实时通知</div>
              <p className="text-sm text-muted-foreground">事件发生时立即通知</p>
            </div>
            <div className="border rounded-lg p-4 bg-primary/10 border-primary cursor-pointer transition-colors">
              <div className="font-medium mb-1">每日摘要</div>
              <p className="text-sm text-muted-foreground">每天发送一次通知摘要</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="font-medium mb-1">每周摘要</div>
              <p className="text-sm text-muted-foreground">每周发送一次通知摘要</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">恢复默认设置</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="size-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                保存中
              </>
            ) : (
              "保存设置"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
