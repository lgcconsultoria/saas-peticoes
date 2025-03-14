"use server"

import { prisma } from "@/lib/prisma";
import { hashSync } from "bcrypt-ts";

export default async function registerAction(_prevState: unknown, formData: FormData) {
  const entries = Array.from(formData.entries());
  const data = Object.fromEntries(entries) as {name: string, email: string, password: string};
  
  console.log("Tentativa de registro para:", data.email);
  
  if (!data.name || !data.email || !data.password) {
    console.log("Dados incompletos no registro");
    return {
        message: "Preencha todos os campos.",
        success: false
    }
  }

  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });
  
  if (user) {
    console.log("Usuário já existe:", data.email);
    return {
        message: "Usuário já existe",
        success: false
    }
  }

  // Usar um salt específico para garantir consistência
  const saltRounds = 10;
  const hashedPassword = hashSync(data.password, saltRounds);
  
  console.log("Criando usuário:", data.email);
  console.log("Senha hash gerada:", hashedPassword.substring(0, 10) + "...");
  
  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  console.log("Usuário criado com sucesso:", data.email);
  
  return {
    message: "Usuário criado com sucesso",
    success: true
  }
}

