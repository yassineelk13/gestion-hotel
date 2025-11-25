import React, { useEffect, useState } from "react";
import chambreApi from "../api/chambreApi"; // Remplacer api par chambreApi

function ChambreList() {
    const [chambres, setChambres] = useState([]);

    useEffect(() => { fetchChambres(); }, []);

    const fetchChambres = async () => {
        try {
            const res = await chambreApi.get("/chambres");
            // Adapter selon la structure de réponse
            if (res.data.success && res.data.data) {
                setChambres(res.data.data.data || res.data.data);
            } else {
                setChambres(res.data);
            }
        } catch (err) {
            console.error("Erreur détaillée:", err);
            alert("Erreur chargement chambres: " + (err.response?.data?.message || err.message));
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Supprimer cette chambre ?")) return;
        try {
            await chambreApi.delete(`/chambres/${id}`);
            fetchChambres();
            alert("Chambre supprimée avec succès");
        } catch (err) {
            alert("Erreur suppression: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="container mt-5">
            <h3>Liste des Chambres</h3>
            <table className="table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Numéro</th>
                    <th>Type</th>
                    <th>Prix/Nuit</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {chambres.map(c => (
                    <tr key={c.id_chambre || c.id}>
                        <td>{c.id_chambre || c.id}</td>
                        <td>{c.numero}</td>
                        <td>{c.type}</td>
                        <td>{c.prix_par_nuit} MAD</td>
                        <td>
                            <span className={`badge ${
                                c.statut === 'libre' ? 'bg-success' :
                                    c.statut === 'occupee' ? 'bg-warning' :
                                        'bg-secondary'
                            }`}>
                                {c.statut}
                            </span>
                        </td>
                        <td>
                            <button className="btn btn-sm btn-danger" onClick={() => remove(c.id_chambre || c.id)}>
                                Supprimer
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default ChambreList;