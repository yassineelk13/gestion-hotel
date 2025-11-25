import React, { useState } from "react";
import chambreApi from "../api/chambreApi"; // Remplacer api par chambreApi

function AddChambre() {
    const [numero, setNumero] = useState("");
    const [type, setType] = useState("");
    const [prix, setPrix] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        try {
            await chambreApi.post("/chambres", {
                numero,
                type,
                prix_par_nuit: parseFloat(prix)
            });
            setNumero(""); setType(""); setPrix("");
            alert("Chambre ajoutée avec succès");
        } catch (err) {
            alert("Erreur lors de l'ajout: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 520 }}>
            <h3>Ajouter Chambre</h3>
            <form onSubmit={submit}>
                <input className="form-control mb-2" placeholder="Numéro" value={numero} onChange={e=>setNumero(e.target.value)} required />
                <input className="form-control mb-2" placeholder="Type" value={type} onChange={e=>setType(e.target.value)} required />
                <input className="form-control mb-2" placeholder="Prix par nuit" value={prix} onChange={e=>setPrix(e.target.value)} required />
                <button className="btn btn-success w-100">Ajouter</button>
            </form>
        </div>
    );
}

export default AddChambre;