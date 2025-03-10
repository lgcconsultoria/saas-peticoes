import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faDownload, faSpinner, faSave } from "@fortawesome/free-solid-svg-icons"

export default function PreviewPetition() {
  return (
    <div id="previa-peticao" className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Prévia da Petição
        </h3>
        <div className="flex space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center cursor-pointer">
            <FontAwesomeIcon icon={faEdit} width={16} height={16} className="mr-2" /> Editar
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center cursor-pointer">
            <FontAwesomeIcon icon={faDownload} width={16} height={16} className="mr-2" /> Download
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-md p-6 bg-gray-50 min-h-[400px]">
        <div className="flex justify-center items-center h-full cursor-pointer">
          <FontAwesomeIcon icon={faSpinner} width={16} height={16} className="fa-spin text-blue-600 text-3xl" />
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-400 italic">
            A prévia da sua petição aparecerá aqui após o preenchimento do
            formulário.
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center cursor-pointer">
          <FontAwesomeIcon icon={faSave} width={16} height={16} className="mr-2" /> Salvar Petição
        </button>
      </div>
    </div>
  );
}
