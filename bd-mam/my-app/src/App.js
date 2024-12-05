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
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Nome"
                        value={newItem.nome}
                        onChange={(e) => setNewItem({ ...newItem, nome: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="função"
                        value={newItem.função}
                        onChange={(e) => setNewItem({ ...newItem, função: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="linha"
                        value={newItem.linha}
                        onChange={(e) => setNewItem({ ...newItem, linha: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="área"
                        value={newItem.área}
                        onChange={(e) => setNewItem({ ...newItem, área: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="jx"
                        value={newItem.jx}
                        onChange={(e) => setNewItem({ ...newItem, jx: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="wx"
                        value={newItem.wx}
                        onChange={(e) => setNewItem({ ...newItem, wx: e.target.value })}
                        required
                    />
                    <button type="submit">Add Item</button>
                </form>
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
