import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('items.db')
    conn.row_factory = sqlite3.Row 
    return conn

@app.route('/items', methods=['GET'])
def get_items():
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM items').fetchall()
    conn.close()
    return jsonify([dict(item) for item in items])

@app.route('/items', methods=['POST'])
def add_item():
    new_item = request.json
    nome = new_item['nome']
    função = new_item['função']
    linha = new_item['linha']
    área = new_item['área']
    jx = new_item['jx']
    wx = new_item['wx']
    
    conn = get_db_connection()
    conn.execute('INSERT INTO items (nome, função, linha, área, jx, wx) VALUES (?, ?, ?, ?, ?, ?)', (nome, função, linha, área, jx, wx))
    conn.commit()
    conn.close()
    return jsonify({"messfunção": "Item adicionado com sucesso!"}), 201

# Rota para inicializar o banco de dados, se necessário
@app.route('/init_db', methods=['GET'])
def init_db():
    conn = get_db_connection()
    conn.execute('''CREATE TABLE IF NOT EXISTS items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nome TEXT NOT NULL,
                        função TEXT NOT NULL,
                        linha TEXT NOT NULL,
                        área INTEGER NOT NULL,
                        jx INTEGER NOT NULL,
                        wx INTEGER NOT NULL
                    )''')
    conn.commit()
    conn.close()
    return jsonify({"messfunção": "Banco de dados inicializado!"})

if __name__ == '__main__':
    app.run(debug=True)
