const map = L.map('mapid').setView([-25.4284, -49.2733], 13); // coordenadas iniciais

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let marker;

// Referências aos elementos da UI
const customPressureCheckbox = document.getElementById('customPressureCheckbox');
const customPressureSection = document.getElementById('customPressureSection');
const locationBasedSection = document.getElementById('locationBasedSection');
const generateJsonBtn = document.getElementById('generateJsonBtn');
const addressInput = document.getElementById('addressInput');
const searchBtn = document.getElementById('searchBtn');
const pavimentosInput = document.getElementById('pavimentosInput');

// Lógica para alternar entre os modos de cálculo
customPressureCheckbox.addEventListener('change', function() {
    if (this.checked) {
        // MODO PRESSÃO PERSONALIZADA
        customPressureSection.style.display = 'block'; // Mostra input de pressão
        locationBasedSection.style.display = 'none'; // Esconde input de pavimentos
        
        // Desativa campos do mapa em vez de esconder o mapa
        addressInput.disabled = true;
        searchBtn.disabled = true;
        
        // Mostra o botão de calcular imediatamente
        generateJsonBtn.style.display = 'block';
    } else {
        // MODO MAPA (PADRÃO)
        customPressureSection.style.display = 'none'; // Esconde input de pressão
        locationBasedSection.style.display = 'block'; // Mostra input de pavimentos
        
        // Reativa os campos do mapa
        addressInput.disabled = false;
        searchBtn.disabled = false;
        
        // Esconde o botão de calcular (ele aparecerá quando um local for selecionado)
        generateJsonBtn.style.display = 'none';
    }
});


function searchLocation() {
    const address = document.getElementById('addressInput').value;

    if (address.trim() === '') {
        alert('Por favor, insira um endereço');
        return;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&viewbox=-74.0,-34.0,-34.0,5.3&bounded=1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                if (lat < -34 || lat > 5.3 || lon < -74 || lon > -34) {
                    alert('O endereço deve estar localizado no Brasil.');
                    return;
                }

                map.setView([lat, lon], 13);
                updateMarker(lat, lon);
                generateJsonBtn.style.display = 'block'; // Mostra o botão
            } else {
                alert('Endereço não encontrado no Brasil.');
            }
        })
        .catch(error => {
            console.error('Erro ao buscar endereço:', error);
        });
}

function updateMarker(lat, lon) {
    if (marker) {
        marker.setLatLng([lat, lon]);
    } else {
        marker = L.marker([lat, lon]).addTo(map);
    }
    map.setView([lat, lon]);
}

map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    updateMarker(lat, lon);
    generateJsonBtn.style.display = 'block'; // Mostra o botão
});

async function sendToServer(requestData) {
    const url = "http://127.0.0.1:5000/pressaovento";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error("Erro ao se comunicar com o servidor.");
        }

        return await response.json();
    } catch (error) {
        console.error("Erro:", error);
        return { pressao_ensaio: "Erro", wx: "N/A", jx: "N/A" };
    }
}

function displayResult(pressao_ensaio, wx, jx) {
    const resultsSection = document.getElementById("results");

    const wxFormatado = wx !== "N/A" ? Math.ceil(wx) : "N/A";
    const jxFormatado = jx !== "N/A" ? parseInt(jx).toLocaleString('pt-BR') : "N/A";
    
    // Arredonda a pressão para exibir, caso seja um número
    const pressaoFormatada = typeof pressao_ensaio === 'number' ? pressao_ensaio.toFixed(2) : pressao_ensaio;


    let resultHTML = `
        <h2>Resultado</h2>
        <div class="result">A pressão de ensaio é <span style="font-size: 20px; color: #007BFF;">${pressaoFormatada}</span> Pa.</div>
    `;

    if (wx && wx !== "N/A") {
        resultHTML += `
            <div class="result">O Módulo de Resistência à Flexão (Wx) necessário é de <span style="font-size: 20px; color: #007BFF;">${wxFormatado}</span> mm³.</div>
        `;
    }

    if (jx && jx !== "N/A") {
        resultHTML += `
            <div class="result">O Momento de Inércia (Jx) necessário é de <span style="font-size: 20px; color: #007BFF;">${jxFormatado}</span> mm⁴.</div>
        `;
    }

    resultsSection.innerHTML = resultHTML;
}

async function generateJson() {
    const larguratotal = document.getElementById('larguraInput').value;
    const quantidadefol = document.getElementById('quantidadefolInput').value;
    const alturafol = document.getElementById('alturafolInput').value;
    
    let requestData = {};

    // Adiciona os dados da esquadria se eles existirem
    if (larguratotal && quantidadefol && alturafol) {
        requestData.larguratotal = larguratotal;
        requestData.quantidadefol = quantidadefol;
        requestData.alturafol = alturafol;
    }

    if (customPressureCheckbox.checked) {
        const pressaoPersonalizada = document.getElementById('pressaoPersonalizadaInput').value;
        if (!pressaoPersonalizada) {
            alert("Por favor, insira um valor para a pressão personalizada.");
            return;
        }
        requestData.pressao_personalizada = pressaoPersonalizada;
    } else {
        if (!marker) {
            alert("Por favor, selecione um local no mapa.");
            return;
        }
        const lat = marker.getLatLng().lat;
        const lon = marker.getLatLng().lng;
        const pavimentos = pavimentosInput.value;
        if (!pavimentos) {
            alert("Por favor, insira a quantidade de pavimentos.");
            return;
        }
        requestData.latitude = lat;
        requestData.longitude = lon;
        requestData.pavimentos = pavimentos;
    }
    
    const response = await sendToServer(requestData);
    const { pressao_ensaio, wx, jx } = response;

    if (pressao_ensaio) {
        displayResult(pressao_ensaio, wx || "N/A", jx || "N/A");
    } else {
        alert("Erro ao calcular. Verifique os dados inseridos.");
    }
}

document.getElementById('searchBtn').addEventListener('click', searchLocation);
document.getElementById('generateJsonBtn').addEventListener('click', generateJson);