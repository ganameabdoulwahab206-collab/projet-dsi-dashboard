package ma.gov.sante.dsi.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO représentant la structure JSON uniforme retournée en cas d'erreur API.
 * <p>
 * Toutes les erreurs du système retournent ce format, ce qui permet
 * au frontend React de les traiter de manière uniforme.
 * </p>
 *
 * <h3>Exemple de réponse JSON (404) :</h3>
 * <pre>
 * {
 *   "timestamp": "2024-07-21T18:05:00",
 *   "statut": 404,
 *   "erreur": "Not Found",
 *   "message": "Projet non trouvé avec id : '42'",
 *   "chemin": "/api/projets/42",
 *   "details": null
 * }
 * </pre>
 *
 * <h3>Exemple de réponse JSON (400 - Validation) :</h3>
 * <pre>
 * {
 *   "timestamp": "2024-07-21T18:05:00",
 *   "statut": 400,
 *   "erreur": "Bad Request",
 *   "message": "Erreur de validation des données",
 *   "chemin": "/api/projets",
 *   "details": ["Le titre est obligatoire", "La date de fin doit être dans le futur"]
 * }
 * </pre>
 */
@Data
@Builder
public class ApiError {

    /**
     * Horodatage de l'erreur (format ISO 8601).
     * Permet au frontend de l'afficher ou de le logger.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Code HTTP de l'erreur (ex: 400, 403, 404, 500).
     */
    private int statut;

    /**
     * Libellé du code HTTP (ex: "Not Found", "Forbidden", "Bad Request").
     */
    private String erreur;

    /**
     * Message descriptif de l'erreur, lisible par le développeur frontend.
     */
    private String message;

    /**
     * Chemin de la requête qui a provoqué l'erreur (ex: "/api/projets/42").
     */
    private String chemin;

    /**
     * Liste de détails supplémentaires (utilisée pour les erreurs de validation).
     * Null si une seule erreur.
     */
    private List<String> details;

    /**
     * Méthode utilitaire statique pour créer rapidement un ApiError.
     *
     * @param status  le statut HTTP
     * @param message le message d'erreur
     * @param chemin  le chemin de la requête
     * @return un ApiError prêt à retourner
     */
    public static ApiError of(HttpStatus status, String message, String chemin) {
        return ApiError.builder()
                .statut(status.value())
                .erreur(status.getReasonPhrase())
                .message(message)
                .chemin(chemin)
                .build();
    }
}
