"use server"

import { redirect } from "next/navigation";
// Removendo a importação não utilizada
// import { cookies } from "next/headers";

export default async function loginAction(_prevState: unknown, formData: FormData) {
    try {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        
        // Chamar a API de autenticação diretamente
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/callback/credentials`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
                redirect: false,
            }),
        });
        
        if (!response.ok) {
            throw new Error("Falha na autenticação");
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Redirecionar para o dashboard após o login bem-sucedido
        redirect("/dashboard");
        
        return { success: true };
    } catch (error) {
        console.error("Erro de login:", error);
        return {
            message: "Email ou senha inválidos",
            success: false
        };
    }
}