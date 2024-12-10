import axios from 'axios';

// Créez une instance Axios
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api/', // L'URL de votre backend Django
    timeout: 5000, // Délai d'attente de la requête (en ms)
    headers: {
        'Content-Type': 'application/json', // En-tête par défaut pour les requêtes JSON
        'Accept': 'application/json', // En-tête pour accepter des réponses en JSON
    },
});

// Intercepteur pour gérer les erreurs globalement
axiosInstance.interceptors.response.use(
    (response) => {
        // Vous pouvez ajouter des traitements ici si nécessaire, par exemple pour la gestion de l'état de l'application
        return response;
    },
    (error) => {
        // Si une réponse d'erreur est reçue
        if (error.response) {
            // Le serveur a répondu avec un code d'erreur
            console.error('Erreur serveur:', error.response.data);
            if (error.response.status === 401) {
                console.error('Non autorisé, veuillez vous connecter.');
            } else if (error.response.status === 404) {
                console.error('Ressource non trouvée.');
            } else if (error.response.status === 500) {
                console.error('Erreur interne du serveur.');
            }
        } else if (error.request) {
            // Pas de réponse du serveur
            console.error('Pas de réponse du serveur:', error.request);
        } else {
            // Erreur lors de la configuration de la requête
            console.error('Erreur lors de la requête:', error.message);
        }
        return Promise.reject(error);  // Retourne l'erreur pour un traitement ultérieur
    }
);

export default axiosInstance;
