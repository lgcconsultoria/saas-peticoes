'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faFolder, faCog } from "@fortawesome/free-solid-svg-icons";

export default function NavLinks() {
  const pathname = usePathname();
  
  return (
    <nav className="flex-1 px-2 space-y-1">
      <Link 
        href="/dashboard" 
        className={`flex items-center px-4 py-3 text-white ${pathname === '/dashboard' ? 'bg-blue-700' : 'hover:bg-blue-700'} rounded-md group`}
      >
        <FontAwesomeIcon icon={faFileAlt} width={16} height={16} className="mr-3" />
        <span>Nova Petição</span>
      </Link>
      <Link 
        href="/minhas-peticoes"
        className={`flex items-center px-4 py-3 text-blue-100 ${pathname === '/minhas-peticoes' ? 'bg-blue-700' : 'hover:bg-blue-700'} rounded-md group`}
      >
        <FontAwesomeIcon icon={faFolder} width={16} height={16} className="mr-3" />
        <span>Minhas Petições</span>
      </Link>
      <Link 
        href="#configuracoes"
        className={`flex items-center px-4 py-3 text-blue-100 ${pathname.includes('configuracoes') ? 'bg-blue-700' : 'hover:bg-blue-700'} rounded-md group`}
      >
        <FontAwesomeIcon icon={faCog} width={16} height={16} className="mr-3" />
        <span>Configurações</span>
      </Link>
    </nav>
  );
} 