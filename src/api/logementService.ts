import axiosInstance from './axiosConfig';

// Définir les types pour les données du formulaire
interface FormDataType {
    nom: string;
    localisation: string;
    description: string;
    // image: File | null;
}

// Fonction pour ajouter un logement
export const addLogement = async (formData: FormDataType): Promise<any> => {
    try {
        // Créer un objet FormData pour envoyer les données du formulaire (y compris l'image)
        const data = new FormData();
        data.append('nom', formData.nom);
        data.append('localisation', formData.localisation);
        data.append('description', formData.description);
        // if (formData.image) {
        //     data.append('image', formData.image);
        // }

        // Envoi de la requête POST pour ajouter le logement
        const response = await axiosInstance.post('logements/', data, {
            headers: {
                'Content-Type': 'multipart/form-data', // Nécessaire pour envoyer un fichier
            },
        });

        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'ajout du logement:', error);
        throw error;
    }
};
