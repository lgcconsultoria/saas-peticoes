"use server"

import { signIn } from "../../../frontend/auth"

export default async function loginAction(_prevState: any, formData: FormData) {
    try {
        await signIn("credentials", {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            redirect: true,
            redirectTo: "/dashboard"
        })
        
        return { success: true }
    } catch (error) {
        return {
            message: "Email ou senha inválidos",
            success: false
        }
    }
}