import Image from "next/image";
import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-blue-800 text-white">
        <div className="flex items-center justify-center h-16 px-4 border-b border-blue-700">
          <h1 className="text-xl font-bold">PeticionaFácil</h1>
        </div>
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          <nav className="flex-1 px-2 space-y-1">
            <Link 
              href="#nova-peticao" 
              className="flex items-center px-4 py-3 text-white bg-blue-700 rounded-md group"
            >
              <i className="fas fa-file-alt mr-3"></i>
              <span>Nova Petição</span>
            </Link>
            <Link 
              href="#minhas-peticoes"
              className="flex items-center px-4 py-3 text-blue-100 hover:bg-blue-700 rounded-md group"
            >
              <i className="fas fa-folder mr-3"></i>
              <span>Minhas Petições</span>
            </Link>
            <Link 
              href="#configuracoes"
              className="flex items-center px-4 py-3 text-blue-100 hover:bg-blue-700 rounded-md group"
            >
              <i className="fas fa-cog mr-3"></i>
              <span>Configurações</span>
            </Link>
          </nav>
        </div>
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center">
            <Image width={30} height={30} className="h-8 w-8 rounded-full bg-blue-600" src="https://via.placeholder.com/32" alt="Avatar" />
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Usuário Demo</p>
              <a href="#" className="text-xs text-blue-200 hover:text-white">Sair</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}