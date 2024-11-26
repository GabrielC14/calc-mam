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

@app.route('/pressaovento', methods=['POST'])
def get_wind_pressure():
    data = request.get_json()
    latitude = data['latitude']
    longitude = data['longitude']
    pavimentos = int(data['pavimentos'])
    point = Point(longitude, latitude)

    for _, row in gdf.iterrows():
        if row['geometry'].contains(point):
            pressao_vento = calcular_pressao(row['pressão_vento'], pavimentos)
            return jsonify({"pressao_vento": pressao_vento})

    return jsonify({"error": "Ponto fora de todas as regiões"}), 404

if __name__ == '__main__':
    app.run(debug=True)
