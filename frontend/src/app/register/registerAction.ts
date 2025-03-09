"use server"

import db from "../../../lib/db";

export default async function registerAction(formData: FormData) {
  const entries = Array.from(formData.entries());
  const data = Object.fromEntries(entries) as {name: string, email: string, password: string};
  
  if (!data.name || !data.email || !data.password) {
    throw new Error("Todos os campos são obrigatórios");
  }
  
  await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
    },
  });

}

