"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { userInfoResponse } from '@/api'

const profileFormSchema = z.object({
    nickName: z
        .string()
        .min(2, {
            message: "昵称至少需要2个字符",
        })
        .max(30, {
            message: "昵称不能超过30个字符",
        }),
    email: z
        .string()
        .email({
            message: "请输入有效的邮箱地址",
        }),
    phone: z.string().optional(),
    gender: z.string(),
    bio: z.string().max(500, {
        message: "个人简介不能超过500个字符",
    }).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
    user: userInfoResponse
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 将性别数值转换为字符串格式
    const genderToString = (gender: number | null | undefined) => {
        if (gender === 1) return "1"
        if (gender === 2) return "2"
        return "0"
    }

    // 默认表单值
    const defaultValues: Partial<ProfileFormValues> = {
        nickName: user.nickName || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: genderToString(user.gender),
        bio: "",
    }

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues,
        mode: "onChange",
    })

    function onSubmit(data: ProfileFormValues) {
        setIsSubmitting(true)


        console.log(data)
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="nickName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>昵称</FormLabel>
                                        <FormControl>
                                            <Input placeholder="请输入您的昵称" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>电子邮箱</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="请输入您的邮箱"
                                                {...field}
                                                disabled
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            邮箱地址不可修改
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>手机号码</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="请输入您的手机号码"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>性别</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="请选择性别" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="0">保密</SelectItem>
                                                <SelectItem value="1">男</SelectItem>
                                                <SelectItem value="2">女</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>个人简介</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="介绍一下自己吧"
                                            className="resize-none"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <span className="size-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        保存中
                                    </>
                                ) : (
                                    "保存更改"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
