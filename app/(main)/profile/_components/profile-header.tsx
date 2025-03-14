"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { userInfoResponse } from '@/api'

interface ProfileHeaderProps {
  user: userInfoResponse
  className?: string
}

export function ProfileHeader({ user, className }: ProfileHeaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const avatarUrl = user.avatar || ""
  
  const handleAvatarChange = () => {
    // 实际项目中这里会实现头像上传逻辑
    setIsUploading(true)
    setTimeout(() => {
      setIsUploading(false)
    }, 2000)
  }

  // 提取用户名首字母作为头像备用显示
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U"
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center gap-6", className)}>
      <div className="relative">
        <Avatar className="size-24 border-2 border-muted">
          <AvatarImage src={avatarUrl} alt={user.nickName || "用户头像"} />
          <AvatarFallback className="text-3xl bg-primary/10 text-primary">
            {getInitials(user.nickName)}
          </AvatarFallback>
        </Avatar>
        <Button 
          size="icon" 
          variant="secondary"
          className="absolute right-0 bottom-0 size-8 rounded-full shadow-md"
          onClick={handleAvatarChange}
          disabled={isUploading}
        >
          {isUploading ? (
            <div className="size-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
          ) : (
            <Camera className="size-4" />
          )}
        </Button>
      </div>
      
      <div className="text-center sm:text-left space-y-1">
        <h1 className="text-2xl font-bold">{user.nickName || "未设置昵称"}</h1>
        <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
          <User className="size-3.5" />
          <span>{user.email}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          注册于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
        </p>
      </div>
    </div>
  )
}
