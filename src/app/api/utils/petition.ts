import { prisma } from "@/lib/prisma";

interface PetitionData {
  processNumber: string;
  type: string;
  entity: string;
  reason: string;
  description: string;
  arguments: string;
  request: string;
  userId: number;
}

export async function createPetition(data: PetitionData) {
  try {
    const petition = await prisma.petition.create({
      data: {
        processNumber: data.processNumber,
        type: data.type,
        entity: data.entity,
        reason: data.reason,
        description: data.description,
        arguments: data.arguments,
        request: data.request,
        userId: data.userId
      }
    });
    return { success: true, data: petition };
  } catch (error) {
    console.error("Erro ao criar petição:", error);
    return { success: false, error: "Erro ao salvar a petição" };
  }
}