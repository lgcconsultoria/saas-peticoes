import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons"
import { getServerSession } from "next-auth";
import LogoutButton from "./LogoutButton";
import NavLinks from "./NavLinks";

export default async function Sidebar() {
  const session = await getServerSession()
  
  return (
    <div className="md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-blue-800 text-white">
        <div className="flex items-center justify-center h-16 px-4 border-b border-blue-700">
          <h1 className="text-xl font-bold">PeticIA Fácil</h1>
        </div>
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600">
              <div className="h-8 w-8 flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} width={16} height={16} className="text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{session?.user?.name}</p>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}