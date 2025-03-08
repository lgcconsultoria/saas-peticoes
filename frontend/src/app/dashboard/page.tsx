import Sidebar from '../components/Sidebar';
import SearchPetition from '../components/SearchPetition';
import TypePetition from '../components/TypePetition';
import NewPetition from '../components/NewPetition';
import PreviewPetition from '../components/PreviewPetition';

const Dashboard: React.FC = () => {

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="md:hidden bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              className="text-gray-500 focus:outline-none"
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="text-xl font-bold text-blue-800">PeticionaFácil</h1>
            <button className="text-gray-500 focus:outline-none">
              <i className="fas fa-user-circle text-xl"></i>
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>

            <SearchPetition />
            <TypePetition />
            <NewPetition />
            <PreviewPetition />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;