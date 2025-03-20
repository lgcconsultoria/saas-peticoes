/**
 * Funções para gerenciar templates e clientes
 */

// Carregar clientes
async function carregarClientes() {
    try {
        const response = await fetch('/api/clientes');
        const data = await response.json();

        if (data.success && data.clientes) {
            return data.clientes;
        } else {
            console.error('Erro ao carregar clientes:', data.error || 'Resposta inválida');
            return [];
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        return [];
    }
}

// Carregar tipos de petição
async function carregarTiposPeticao() {
    try {
        const response = await fetch('/api/tipos-peticao');
        const data = await response.json();

        if (data.success && data.tipos) {
            return data.tipos;
        } else {
            console.error('Erro ao carregar tipos de petição:', data.error || 'Resposta inválida');
            return {};
        }
    } catch (error) {
        console.error('Erro ao carregar tipos de petição:', error);
        return {};
    }
}

// Preencher select de clientes
async function preencherSelectClientes(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Limpar opções existentes
    select.innerHTML = '<option value="">Selecione um cliente</option>';

    // Carregar clientes
    const clientes = await carregarClientes();

    // Adicionar opções
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        select.appendChild(option);
    });
}

// Preencher select de tipos de petição
async function preencherSelectTiposPeticao(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Limpar opções existentes
    select.innerHTML = '<option value="">Selecione um tipo de petição</option>';

    // Carregar tipos de petição
    const tipos = await carregarTiposPeticao();

    // Adicionar opções
    Object.entries(tipos).forEach(([id, tipo]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = tipo.titulo;
        option.dataset.papelCliente = tipo.papel_cliente;
        option.dataset.papelContraparte = tipo.papel_contraparte;
        select.appendChild(option);
    });
}

// Atualizar informações do tipo de petição selecionado
function atualizarInfoTipoPeticao(selectId, papelClienteId, papelContraparteId) {
    const select = document.getElementById(selectId);
    const papelClienteElement = document.getElementById(papelClienteId);
    const papelContraparteElement = document.getElementById(papelContraparteId);

    if (!select || !papelClienteElement || !papelContraparteElement) return;

    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption && selectedOption.value) {
        const papelCliente = selectedOption.dataset.papelCliente;
        const papelContraparte = selectedOption.dataset.papelContraparte;

        papelClienteElement.textContent = papelCliente || '';
        papelContraparteElement.textContent = papelContraparte || '';
    } else {
        papelClienteElement.textContent = '';
        papelContraparteElement.textContent = '';
    }
}

// Inicializar formulário
async function inicializarFormulario() {
    // Preencher selects
    await preencherSelectClientes('cliente');
    await preencherSelectTiposPeticao('tipo');

    // Adicionar event listeners
    const tipoSelect = document.getElementById('tipo');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', () => {
            atualizarInfoTipoPeticao('tipo', 'papel-cliente', 'papel-contraparte');
        });
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarFormulario); 