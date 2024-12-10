// import React, { useState } from "react";
// import "./EtatDesLieuxForm.css";

// const EtatDesLieuxForm = () => {
//     const [formData, setFormData] = useState({
//         portail: "",
//         porteEntree: "",
//         compteurEneo: "",
//         compteurEau: "",
//         cableTelephone: "",
//         securite: "",
//         salon: "",
//         chambres: "",
//         cuisine: "",
//         autres: "",
//         observations: "",
//     });

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData({ ...formData, [name]: value });
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         console.log("Fiche d'état des lieux soumise :", formData);
//         alert("Fiche d'état des lieux enregistrée avec succès !");
//     };

//     return (
//         <div className="etat-des-lieux">
//             <h2>Fiche d'état des lieux</h2>
//             <form onSubmit={handleSubmit}>
//                 <h3>Informations générales</h3>
//                 <div className="form-group">
//                     <label>Portail / Portillon :</label>
//                     <input
//                         type="text"
//                         name="portail"
//                         value={formData.portail}
//                         onChange={handleChange}
//                     />
//                 </div>
//                 <div className="form-group">
//                     <label>Porte d'entrée :</label>
//                     <input
//                         type="text"
//                         name="porteEntree"
//                         value={formData.porteEntree}
//                         onChange={handleChange}
//                     />
//                 </div>
//                 <div className="form-group">
//                     <label>Compteur ENEO :</label>
//                     <input
//                         type="text"
//                         name="compteurEneo"
//                         value={formData.compteurEneo}
//                         onChange={handleChange}
//                     />
//                 </div>
//                 <div className="form-group">
//                     <label>Compteur d'eau :</label>
//                     <input
//                         type="text"
//                         name="compteurEau"
//                         value={formData.compteurEau}
//                         onChange={handleChange}
//                     />
//                 </div>
//                 <div className="form-group">
//                     <label>Câble de téléphone :</label>
//                     <input
//                         type="text"
//                         name="cableTelephone"
//                         value={formData.cableTelephone}
//                         onChange={handleChange}
//                     />
//                 </div>
//                 <div className="form-group">
//                     <label>Sécurité :</label>
//                     <input
//                         type="text"
//                         name="securite"
//                         value={formData.securite}
//                         onChange={handleChange}
//                     />
//                 </div>

//                 <h3>État des pièces</h3>
//                 <div className="form-group">
//                     <label>Salon et Couloir :</label>
//                     <input
//                         type="text"
//                         name="salon"
//                         value={formData.salon}
//                         onChange={handleChange}
//                     />
//                 </div>
//                 <div className="form-group">
//                     <label>Chambres :</label>
//                     <input
//                         type="text"
//                         name="chambres"
//                         value={formData.chambres}
//                         onChange={handleChange}
//                     />
//                 </div>
//                 <div className="form-group">
//                     <label>Cuisine :</label>
//                     <input
//                         type="text"
//                         name="cuisine"
//                         value={formData.cuisine}
//                         onChange={handleChange}
//                     />
//                 </div>
//                 <div className="form-group">
//                     <label>Autres espaces :</label>
//                     <input
//                         type="text"
//                         name="autres"
//                         value={formData.autres}
//                         onChange={handleChange}
//                     />
//                 </div>

//                 <h3>Observations</h3>
//                 <div className="form-group">
//                     <textarea
//                         name="observations"
//                         rows="5"
//                         value={formData.observations}
//                         onChange={handleChange}
//                         placeholder="Ajouter des remarques..."
//                     ></textarea>
//                 </div>

//                 <button type="submit" className="submit-button">
//                     Enregistrer
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default EtatDesLieuxForm;
