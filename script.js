// Inicialização do mapa com OpenStreetMap
const map = L.map('mapid').setView([-25.4284, -49.2733], 13); // Coordenadas iniciais para o centro de Curitiba

// Adiciona o tile layer (camada do mapa)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let marker;

// Função para buscar as coordenadas do endereço usando Nominatim
function searchLocation() {
    const address = document.getElementById('addressInput').value;

    if (address.trim() === '') {
        alert('Por favor, insira um endereço');
        return;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;

                // Ajusta a posição do mapa e adiciona um marcador
                map.setView([lat, lon], 13);

                if (marker) {
                    marker.setLatLng([lat, lon]);
                } else {
                    marker = L.marker([lat, lon]).addTo(map);
                }

                document.getElementById('generateJsonBtn').style.display = 'block'; // Exibe o botão para gerar JSON
            } else {
                alert('Endereço não encontrado.');
            }
        })
        .catch(error => {
            console.error('Erro ao buscar endereço:', error);
        });
}

// Função para enviar coordenadas ao servidor
async function getRegionFromServer(lat, lon) {
    const url = "http://127.0.0.1:5000/get-region"; // URL do servidor Flask

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                latitude: lat,
                longitude: lon,
            }),
        });

        if (!response.ok) {
            throw new Error("Erro ao se comunicar com o servidor.");
        }

        const data = await response.json();
        return data.region;
    } catch (error) {
        console.error("Erro:", error);
        return "Erro ao buscar região.";
    }
}

// Função para exibir o resultado de maneira formatada
function displayResult(region) {
    const resultsSection = document.getElementById("results");

    // Limpa os resultados anteriores
    resultsSection.innerHTML = `
        <h2>Resultados</h2>
        <div class="result">A coordenada está localizada na região <span style="font-size: 22px; color: #007BFF;">${region}</span>.</div>
    `;
}

// Alteração na função para gerar o JSON com a região
async function generateJson() {
    const lat = marker.getLatLng().lat;
    const lon = marker.getLatLng().lng;

    // Obtem a região correspondente do servidor Python
    const region = await getRegionFromServer(lat, lon);

    const coordinates = {
        latitude: lat,
        longitude: lon,
        region: region,
    };

    const jsonOutput = JSON.stringify(coordinates, null, 2);

    const resultsSection = document.getElementById("results");
    resultsSection.innerHTML = `
        <h2>Dados com Região</h2>
        <pre>${jsonOutput}</pre>
    `;

    // Exibe o resultado de forma mais bonita
    displayResult(region);
}

// Event listeners
document.getElementById('searchBtn').addEventListener('click', searchLocation);
document.getElementById('generateJsonBtn').addEventListener('click', generateJson);