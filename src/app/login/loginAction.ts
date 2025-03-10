"use server"

import { signIn } from "next-auth/react"

export default async function loginAction(_prevState: unknown, formData: FormData) {
    try {
        await signIn("credentials", {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            redirect: true,
            redirectTo: "/dashboard"
        })
        
        return { success: true }
    } catch {
        return {
            message: "Email ou senha inválidos",
            success: false
        }
    }
}