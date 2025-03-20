import Sidebar from '../components/Sidebar';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import PetitionList from '../components/PetitionList';

const prisma = new PrismaClient();

// Função auxiliar para obter o ID do usuário da sessão
async function getUserId(email: string): Promise<number> {
  // Buscar o usuário pelo email
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  return user?.id || 0;
}

export default async function MinhasPeticoes({
  searchParams
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/');
  }

  // Obter o ID do usuário
  const userId = await getUserId(session.user?.email || '');
  
  if (!userId) {
    redirect('/');
  }

  // Obter o termo de busca da URL
  const { search = '' } = await searchParams;

  // Buscar as petições do usuário
  const peticoes = await prisma.petition.findMany({
    where: {
      userId: userId,
      ...(search ? {
        processNumber: {
          contains: search,
          mode: 'insensitive'
        }
      } : {})
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Minhas Petições</h2>            
            <PetitionList peticoes={peticoes} />
          </div>
        </main>
      </div>
    </div>
  );
} 