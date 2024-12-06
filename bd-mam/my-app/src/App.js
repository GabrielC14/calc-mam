import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ nome: "", função: "", linha: "", área: "", jx: "", wx: "" });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:5000/items");
            setItems(response.data);
        } catch (error) {
            console.error("Erro ao buscar itens:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://127.0.0.1:5000/items", newItem);
            setNewItem({ nome: "", função: "", linha: "", área: "", jx: "", wx: "" });
            setShowForm(false);
            fetchItems();
        } catch (error) {
            console.error("Erro ao adicionar item:", error);
        }
    };

    return (
        <div className="App">
            <h3>Banco de dados de resistência dos perfis</h3>
            <br></br>
            <div>
    <h3 class="titulo_add">Adicionar Novo Item</h3>
    <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="form-horizontal">
            <input
                type="text"
                placeholder="Nome"
                value={newItem.nome}
                onChange={(e) => setNewItem({ ...newItem, nome: e.target.value })}
                required
            />
            <input
                type="text"
                placeholder="Função"
                value={newItem.função}
                onChange={(e) => setNewItem({ ...newItem, função: e.target.value })}
                required
            />
            <input
                type="text"
                placeholder="Linha"
                value={newItem.linha}
                onChange={(e) => setNewItem({ ...newItem, linha: e.target.value })}
                required
            />
            <input
                type="number"
                placeholder="Área"
                value={newItem.área}
                onChange={(e) => setNewItem({ ...newItem, área: e.target.value })}
                required
            />
            <input
                type="number"
                placeholder="Jx"
                value={newItem.jx}
                onChange={(e) => setNewItem({ ...newItem, jx: e.target.value })}
                required
            />
            <input
                type="number"
                placeholder="Wx"
                value={newItem.wx}
                onChange={(e) => setNewItem({ ...newItem, wx: e.target.value })}
                required
            />
            <button type="submit">Adicionar</button>
        </form>
    </div>
</div>


                <br></br>
                <table>
    <thead>
        <tr>
            <th>Nome</th>
            <th>Função</th>
            <th>Linha</th>
            <th>Área</th>
            <th>Jx</th>
            <th>Wx</th>
        </tr>
    </thead>
    <tbody>
        {items.map((item) => (
            <tr key={item.id}>
                <td>{item.nome}</td>
                <td>{item.função}</td>
                <td>{item.linha}</td>
                <td>{item.área}</td>
                <td>{item.jx}</td>
                <td>{item.wx}</td>
            </tr>
        ))}
    </tbody>
</table>

        </div>
    );
}

export default App;
