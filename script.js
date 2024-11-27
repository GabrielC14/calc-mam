const map = L.map('mapid').setView([-25.4284, -49.2733], 13); // Coordenadas iniciais

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let marker;

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

                if (marker) {
                    marker.setLatLng([lat, lon]);
                } else {
                    marker = L.marker([lat, lon]).addTo(map);
                }

                document.getElementById('generateJsonBtn').style.display = 'block';
            } else {
                alert('Endereço não encontrado no Brasil.');
            }
        })
        .catch(error => {
            console.error('Erro ao buscar endereço:', error);
        });
}

async function getWindPressureFromServer(lat, lon, pavimentos, larguratotal, quantidadefol, alturafol) {
    const url = "http://127.0.0.1:5000/pressaovento"; // 

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                latitude: lat,
                longitude: lon,
                pavimentos: pavimentos,
                quantidadefol: quantidadefol,
                larguratotal: larguratotal,
                alturafol: alturafol
            }),
        });

        if (!response.ok) {
            throw new Error("Erro ao se comunicar com o servidor.");
        }

        const data = await response.json();
        console.log("Dados recebidos do servidor:", data); // tudo certo aqui tb
        return{
            pressao_ensaio: data.pressao_ensaio, 
            wx: data.wx, 
            jx: data.jx
        };
    } catch (error) {
        console.error("Erro:", error);
        return { pressao_ensaio: "Erro", wx: "Erro", jx: "Erro" };
    }
}

function displayResult(pressao_ensaio, wx, jx) {
    const resultsSection = document.getElementById("results");

    resultsSection.innerHTML = `
        <h2>Resultado</h2>
        <div class="result">A pressão de ensaio é <span style="font-size: 22px; color: #007BFF;">${pressao_ensaio}</span> Pa.</div>
        <div class="result">A pressão de ensaio é <span style="font-size: 22px; color: #007BFF;">${wx}</span> mm4.</div>
        <div class="result">A pressão de ensaio é <span style="font-size: 22px; color: #007BFF;">${jx}</span> mm4.</div>
    `;
}

async function generateJson() {
    const lat = marker.getLatLng().lat;
    const lon = marker.getLatLng().lng;
    const pavimentos = document.getElementById('pavimentosInput').value;
    const larguratotal = document.getElementById('larguraInput').value;
    const quantidadefol = document.getElementById('quantidadefolInput').value;
    const alturafol = document.getElementById('alturafolInput').value;

    const { pressao_ensaio, wx, jx } = await getWindPressureFromServer(lat, lon, pavimentos, larguratotal, quantidadefol, alturafol);
    console.log("Valores recebidos:", pressao_ensaio, wx, jx); // tudo certo aqui

    const coordinates = {
        latitude: lat,
        longitude: lon,
        pavimentos: pavimentos,
        larguratotal: larguratotal,
        quantidadefol: quantidadefol,
        pressao_ensaio: pressao_ensaio,
        wx: wx,
        jx: jx,
        alturafol: alturafol
    };

    const jsonOutput = JSON.stringify(coordinates, null, 2);

    const resultsSection = document.getElementById("results");
    resultsSection.innerHTML = `
        <h2>Dados com Pressão de Ensaio</h2>
        <pre>${jsonOutput}</pre>
    `;

    displayResult(pressao_ensaio, wx, jx);
}

document.getElementById('searchBtn').addEventListener('click', searchLocation);
document.getElementById('generateJsonBtn').addEventListener('click', generateJson);