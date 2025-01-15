from flask import Flask, request, jsonify
from flask_cors import CORS
import geopandas as gpd
from shapely.geometry import Point

app = Flask(__name__)
CORS(app)

geojson_path = r"C:\Users\Gabriel\Desktop\Calc-Mam\Regiões.geojson"
gdf = gpd.read_file(geojson_path)

pressao_map = {
    '1': {
        2: 350,  # Para 2 pavimentos, região 1.
        5: 420,  # Para 5 pavimentos, região 1.
        10: 500,  # Para 10 pavimentos, região 1.
        20: 600,  # Para 20 pavimentos, região 1.
        30: 660,  # Para 30 pavimentos, região 1.
    },
    '2': {
        2: 470,  # Para 2 pavimentos, região 2.
        5: 580,  # Para 5 pavimentos, região 2.
        10: 680,  # Para 10 pavimentos, região 2.
        20: 815,  # Para 20 pavimentos, região 2.
        30: 890,  # Para 30 pavimentos, região 2.
    },
    '3': {
        2: 610,  # Para 2 pavimentos, região 3.
        5: 750,  # Para 5 pavimentos, região 3.
        10: 890,  # Para 10 pavimentos, região 3.
        20: 1060,  # Para 20 pavimentos, região 3
        30: 1170,  # Para 30 pavimentos, região 3.
    },
    '4': {
        2: 770,  # Para 2 pavimentos, região 4.
        5: 950,  # Para 5 pavimentos, região 4.
        10: 1130,  # Para 10 pavimentos, região 4.
        20: 1350,  # Para 20 pavimentos, região 4.
        30: 1480,  # Para 30 pavimentos, região 4.
    },
    '5': {
        2: 950,  # Para 2 pavimentos, região 5.
        5: 1180,  # Para 5 pavimentos, região 5.
        10: 1400,  # Para 10 pavimentos, região 5.
        20: 1660,  # Para 20 pavimentos, região 5.
        30: 1820,  # Para 30 pavimentos, região 5.
    },
}

def calcular_pressao(region, pavimentos):
    if region in pressao_map:
        pavimentos_disponiveis = sorted(pressao_map[region].keys())
        pavimentos_usados = next((p for p in pavimentos_disponiveis if p >= pavimentos), None)
        
        if pavimentos_usados:
            return pressao_map[region][pavimentos_usados]
        else:
            return "Pressão não definida para este número de pavimentos"
    else:
        return "Região não definida"

def largurafolha(larguratotal, quantidadefol):
    return larguratotal / quantidadefol

def calcular_wx(pressao_ensaio, largurafol, alturafol, lrt):
    """
    Limite de tensão: ( Wx )
    (P * 10^-6 * L * H^2) / (4 * LRT)
    """
    return (pressao_ensaio*1e-6*largurafol*alturafol**2)/(4*lrt)

def calcular_jx(pressao_ensaio, largurafol, alturafol, melast):
    """
    Limite de flecha: ( Jx )
    (5*P*10^-6*L*H^4)/(H*2.1943*E)     (P*10^-6*L*H^4)/(1536*E)
    """
    return max(((5*pressao_ensaio*1e-6*largurafol*alturafol**4)/(alturafol*2.1943*melast)), ((pressao_ensaio*1e-6*largurafol*alturafol**4)/(1536*melast))) 

@app.route('/pressaovento', methods=['POST']) # ta pegando os dados do json pra fazer a pressao
def get_wind_pressure():
    data = request.get_json()
    print(f"Dados recebidos: {data}") # aq ta o print excluir dps
    latitude = data['latitude'] # mantem
    longitude = data['longitude'] # mantem
    pavimentos = int(data['pavimentos']) # mantem 
    point = Point(longitude, latitude) # mantem

    

    for _, row in gdf.iterrows():
        if row['geometry'].contains(point):
            pressao_ensaio = calcular_pressao(row['pressão_vento'], pavimentos)
            print(f"Pressão de ensaio calculada: {pressao_ensaio}, tipo: {type(pressao_ensaio)}")

            response = {"pressao_ensaio": pressao_ensaio}

            if 'larguratotal' in data and 'quantidadefol' in data and 'alturafol' in data: # ta pegando do msm json os outros dados que vieram, caso venham, pra fazer o jx e wx
                larguratotal = int(data['larguratotal'])
                quantidadefol = int(data['quantidadefol'])
                alturafol = int(data['alturafol'])
                lrt = 150
                melast = 70000

                largurafol = largurafolha(larguratotal, quantidadefol)
                wx = calcular_wx(pressao_ensaio, largurafol, alturafol, lrt)
                jx = calcular_jx(pressao_ensaio, largurafol, alturafol, melast)
                print(f"Wx calculado: {wx}")
                print(f"Jx calculado: {jx}")

                response.update({ #se tiver dados pro jx e wx ele retorna isso ai
                    "wx": wx,
                    "jx": jx
                })
            return jsonify(response)
        
    return jsonify({"error": "Ponto fora de todas as regiões"}), 404
if __name__ == '__main__':
    app.run(debug=True)