import Sidebar from '../../components/Sidebar';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import EditPetition from '../../components/EditPetition';

const prisma = new PrismaClient();

// Função auxiliar para obter o ID do usuário da sessão
async function getUserId(email: string): Promise<number> {
  // Buscar o usuário pelo email
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  return user?.id || 0;
}

export default async function EditarPeticao({ params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/');
  }

  // Obter o ID do usuário
  const userId = await getUserId(session.user?.email || '');
  
  if (!userId) {
    redirect('/');
  }

  // Buscar a petição pelo ID
  const peticao = await prisma.petition.findFirst({
    where: {
      id: parseInt(params.id),
      userId: userId
    }
  });

  // Se a petição não existir ou não pertencer ao usuário, redirecionar
  if (!peticao) {
    redirect('/minhas-peticoes');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Editar Petição</h2>
            
            <EditPetition peticao={peticao} />
          </div>
        </main>
      </div>
    </div>
  );
} 