import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

export default function Sidebar() {
  return (
    <div className="mb-8">
      <div className="relative">
        <input 
          type="text" 
          placeholder="Buscar petições..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FontAwesomeIcon icon={faSearch} width={16} height={16} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}