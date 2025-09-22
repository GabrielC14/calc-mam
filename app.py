from flask import Flask, request, jsonify
from flask_cors import CORS
import geopandas as gpd
from shapely.geometry import Point
import time
import collections
import requests
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
CORS(app, origins=["https://calculoperfil.gabrielvc.com.br", "http://127.0.0.1:5500", "https://gabrielvc.com.br"])

geojson_path = "Regiões.geojson"
gdf = gpd.read_file(geojson_path)

pressao_map = {
    '1': {2: 350, 5: 420, 10: 500, 20: 600, 30: 660},
    '2': {2: 470, 5: 580, 10: 680, 20: 815, 30: 890},
    '3': {2: 610, 5: 750, 10: 890, 20: 1060, 30: 1170},
    '4': {2: 770, 5: 950, 10: 1130, 20: 1350, 30: 1480},
    '5': {2: 950, 5: 1180, 10: 1400, 20: 1660, 30: 1820},
}

def calcular_pressao(region, pavimentos):
    if region in pressao_map:
        pavimentos_disponiveis = sorted(pressao_map[region].keys())
        pavimentos_usados = next((p for p in pavimentos_disponiveis if p >= pavimentos), None)
        
        if pavimentos_usados:
            return pressao_map[region][pavimentos_usados]
        else:
            # Se pavimentos for > 30, usa o valor de 30
            return pressao_map[region][pavimentos_disponiveis[-1]]
    else:
        return "Região não definida"

def largurafolha(larguratotal, quantidadefol):
    return larguratotal / quantidadefol

def calcular_wx(pressao_ensaio, largurafol, alturafol, lrt):
    return (pressao_ensaio * 1e-6 * largurafol * alturafol**2) / (4 * lrt)

def calcular_jx(pressao_ensaio, largurafol, alturafol, melast):
    jx1 = (5 * pressao_ensaio * 1e-6 * largurafol * alturafol**4) / (384 * melast * (alturafol / 175))
    jx2 = (5 * pressao_ensaio * 1e-6 * largurafol * alturafol**4) / (384 * melast * 20)
    return max(jx1, jx2)

@app.route('/pressaovento', methods=['POST'])
def get_wind_pressure():
    data = request.get_json()
    print(f"Dados recebidos: {data}")
    
    pressao_ensaio = None
    response = {}
    if 'pressao_personalizada' in data and data['pressao_personalizada']:
        try:
            pressao_ensaio = float(data['pressao_personalizada'])
        except (ValueError, TypeError):
            return jsonify({"error": "Valor de pressão personalizada inválido"}), 400
    else:
        try:
            latitude = data['latitude']
            longitude = data['longitude']
            pavimentos = int(data['pavimentos'])
            point = Point(longitude, latitude)
        except (KeyError, ValueError) as e:
            return jsonify({"error": f"Dados faltando ou inválidos: {e}"}), 400

        region_found = False
        for _, row in gdf.iterrows():
            if row['geometry'].contains(point):
                pressao_ensaio = calcular_pressao(row['pressão_vento'], pavimentos)
                region_found = True
                break
        
        if not region_found:
            return jsonify({"error": "Ponto fora de todas as regiões"}), 404

    # Se a pressão foi calculada ou fornecida, prossegue
    if pressao_ensaio is not None and isinstance(pressao_ensaio, (int, float)):
        response["pressao_ensaio"] = pressao_ensaio
        
        # Calcula Wx e Jx se os dados da esquadria estiverem presentes
        if 'larguratotal' in data and 'quantidadefol' in data and 'alturafol' in data:
            try:
                larguratotal = float(data['larguratotal'])
                quantidadefol = int(data['quantidadefol'])
                alturafol = float(data['alturafol'])
                lrt = 150  # N/mm²
                melast = 70000  # MPa

                largura_folha = largurafolha(larguratotal, quantidadefol)
                wx = calcular_wx(pressao_ensaio, largura_folha, alturafol, lrt)
                jx = calcular_jx(pressao_ensaio, largura_folha, alturafol, melast)

                response.update({"wx": wx, "jx": jx})
            except (ValueError, TypeError):
                # Se os dados da esquadria forem inválidos, continua sem wx e jx
                pass
        
        return jsonify(response)

    return jsonify({"error": "Não foi possível determinar a pressão de ensaio"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Rota pro UptimeRobot"""
    return "Online!", 200

SITES_PARA_MONITORAR = {
    "croquis": "https://croquis.gabrielvc.com.br",
    "calculoperfil": "https://calculoperfil.gabrielvc.com.br"
}

HISTORICO_MAXIMO = 12

status_data = {site_id: collections.deque(maxlen=HISTORICO_MAXIMO) for site_id in SITES_PARA_MONITORAR}

# --- FUNÇÕES DO STATUS CHECKER ---
def ping_site(url):
    try:
        start_time = time.time()
        response = requests.get(url, timeout=10)
        end_time = time.time()
        
        if response.status_code >= 200 and response.status_code < 300:
            latencia_ms = round((end_time - start_time) * 1000)
            return {"status": "online", "ms": latencia_ms}
        else:
            return {"status": "error", "ms": -1, "code": response.status_code}
            
    except requests.RequestException:
        return {"status": "offline", "ms": -1}

def atualizar_todos_os_status():
    print("Iniciando verificação de status de todos os sites...")
    with app.app_context(): 
        for site_id, url in SITES_PARA_MONITORAR.items():
            resultado = ping_site(url)
            status_data[site_id].append(resultado)
            print(f" - {url}: {resultado['status']} ({resultado['ms']}ms)")
    print("Verificação concluída.")

# --- API ENDPOINT DO STATUS CHECKER ---
@app.route('/status', methods=['GET'])
def get_status():
    dados_para_frontend = {site_id: list(historico) for site_id, historico in status_data.items()}
    return jsonify(dados_para_frontend)

scheduler = BackgroundScheduler(daemon=True)

scheduler.add_job(atualizar_todos_os_status, 'interval', minutes=5)
scheduler.start()

@app.before_first_request
def initial_status_check():
    print("Realizando a primeira verificação de status ao iniciar...")
    atualizar_todos_os_status()

if __name__ == '__main__':
    app.run(debug=True)