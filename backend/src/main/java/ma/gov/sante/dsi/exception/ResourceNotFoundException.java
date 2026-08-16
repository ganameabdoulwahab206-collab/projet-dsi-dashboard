package ma.gov.sante.dsi.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception levée quand une ressource demandée n'existe pas en base de données.
 * <p>
 * L'annotation {@code @ResponseStatus} indique à Spring de retourner
 * un HTTP 404 Not Found si cette exception n'est pas interceptée par
 * le {@link GlobalExceptionHandler}.
 * </p>
 *
 * Exemple d'utilisation dans un service :
 * <pre>
 *   Projet projet = projetRepository.findById(id)
 *       .orElseThrow(() -> new ResourceNotFoundException("Projet", "id", id));
 * </pre>
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    /** Nom de la ressource concernée (ex: "Projet", "Utilisateur", "Tache") */
    private final String resourceName;

    /** Nom du champ utilisé pour la recherche (ex: "id", "email") */
    private final String fieldName;

    /** Valeur du champ qui n'a rien retourné (ex: 42, "user@email.ma") */
    private final Object fieldValue;

    /**
     * Constructeur principal.
     * <p>
     * Génère automatiquement un message lisible :
     * "Projet non trouvé avec id : 42"
     * </p>
     *
     * @param resourceName nom de la ressource (ex: "Projet")
     * @param fieldName    nom du champ de recherche (ex: "id")
     * @param fieldValue   valeur qui n'a pas donné de résultat (ex: 42)
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s non trouvé avec %s : '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    public String getResourceName() { return resourceName; }
    public String getFieldName()    { return fieldName; }
    public Object getFieldValue()   { return fieldValue; }
}
