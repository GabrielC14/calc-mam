from flask import Flask, request, jsonify
from flask_cors import CORS
import geopandas as gpd
from shapely.geometry import Point

app = Flask(__name__)
CORS(app)  # Ativa o CORS para todas as rotas

geojson_path = r"C:\Users\Gabriel\Desktop\Calc-Mam\Regiões.geojson"
gdf = gpd.read_file(geojson_path)

@app.route('/get-region', methods=['POST'])
def get_region():
    data = request.get_json()
    latitude = data['latitude']
    longitude = data['longitude']
    point = Point(longitude, latitude)

    for _, row in gdf.iterrows():
        if row['geometry'].contains(point):
            return jsonify({"region": row['pressão_vento']})  # Ajuste para o atributo correto
    return jsonify({"error": "Ponto fora de todas as regiões"}), 404

if __name__ == '__main__':
    app.run(debug=True)


