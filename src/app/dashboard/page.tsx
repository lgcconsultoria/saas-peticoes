import Sidebar from '../components/Sidebar';
import SearchPetition from '../components/SearchPetition';
import TypePetition from '../components/TypePetition';
import NewPetition from '../components/NewPetition';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {

  const session = await getServerSession()

  if (!session) {
    redirect('/')
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>

            <SearchPetition />
            <TypePetition />
            <NewPetition />
          </div>
        </main>
      </div>
    </div>
  );
}