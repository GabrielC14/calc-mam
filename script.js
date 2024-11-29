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

    const requestData = {
        latitude: lat,
        longitude: lon,
        pavimentos: pavimentos,
    };

    if (larguratotal && quantidadefol && alturafol) {
        requestData.larguratotal = larguratotal;
        requestData.quantidadefol = quantidadefol;
        requestData.alturafol = alturafol;
    }

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

    let resultHTML = `
        <h2>Resultado</h2>
        <div class="result">A pressão de ensaio é <span style="font-size: 20px; color: #007BFF;">${pressao_ensaio}</span> Pa.</div>
    `;

    if (wx && wx !== "N/A") {
        resultHTML += `
            <div class="result">O Módulo de Resistência à Flexão (Wx) é <span style="font-size: 20px; color: #007BFF;">${wx}</span> mm⁴.</div>
        `;
    }

    if (jx && jx !== "N/A") {
        resultHTML += `
            <div class="result">O Momento de Inércia (Jx) é <span style="font-size: 20px; color: #007BFF;">${jx}</span> mm⁴.</div>
        `;
    }

    resultsSection.innerHTML = resultHTML;
}

async function generateJson() {
    const lat = marker.getLatLng().lat;
    const lon = marker.getLatLng().lng;
    const pavimentos = document.getElementById('pavimentosInput').value;


    const larguratotal = document.getElementById('larguraInput').value;
    const quantidadefol = document.getElementById('quantidadefolInput').value;
    const alturafol = document.getElementById('alturafolInput').value;

    const requestData = {
        latitude: lat,
        longitude: lon,
        pavimentos: pavimentos
    };
    if (larguratotal && quantidadefol && alturafol) {
        requestData.larguratotal = larguratotal;
        requestData.quantidadefol = quantidadefol;
        requestData.alturafol = alturafol;
    }

    const response = await getWindPressureFromServer(
        requestData.latitude,
        requestData.longitude,
        requestData.pavimentos,
        requestData.larguratotal,
        requestData.quantidadefol,
        requestData.alturafol
    );

    const { pressao_ensaio, wx, jx } = response;

    // Exibe o resultado
    if (pressao_ensaio) {
        displayResult(pressao_ensaio, wx || "N/A", jx || "N/A");
    } else {
        alert("Erro ao calcular a pressão de ensaio.");
    }
}

document.getElementById('searchBtn').addEventListener('click', searchLocation);
document.getElementById('generateJsonBtn').addEventListener('click', generateJson);