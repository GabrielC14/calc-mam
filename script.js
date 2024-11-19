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

// Função para gerar o JSON com as coordenadas
function generateJson() {
    const lat = marker.getLatLng().lat;
    const lon = marker.getLatLng().lng;

    const coordinates = {
        latitude: lat,
        longitude: lon
    };

    const jsonOutput = JSON.stringify(coordinates, null, 2);

    const resultsSection = document.getElementById('results');
    resultsSection.innerHTML = `
        <h2>Coordenadas JSON</h2>
        <pre>${jsonOutput}</pre>
    `;
}

// Event listeners
document.getElementById('searchBtn').addEventListener('click', searchLocation);
document.getElementById('generateJsonBtn').addEventListener('click', generateJson);