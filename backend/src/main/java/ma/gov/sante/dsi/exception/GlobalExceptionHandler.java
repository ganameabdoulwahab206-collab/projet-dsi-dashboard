package ma.gov.sante.dsi.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

/**
 * Gestionnaire global des exceptions pour toute l'application DSI Dashboard.
 * <p>
 * {@code @RestControllerAdvice} intercepte toutes les exceptions levées dans
 * les controllers et les transforme en réponse JSON uniformisée {@link ApiError}.
 * </p>
 *
 * <p>Avantages de cette approche centralisée :</p>
 * <ul>
 *   <li>Un seul endroit pour gérer toutes les erreurs</li>
 *   <li>Format JSON cohérent pour le frontend React</li>
 *   <li>Séparation des préoccupations (les controllers ne gèrent pas les erreurs)</li>
 *   <li>Logs centralisés pour le monitoring</li>
 * </ul>
 *
 * <h3>Ordre de priorité des handlers :</h3>
 * Spring applique le handler le plus spécifique en premier.
 * L'exception {@code Exception} générique est le filet de sécurité final.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // =========================================================================
    // 1. ERREURS MÉTIER PERSONNALISÉES (4xx)
    // =========================================================================

    /**
     * Gère les erreurs 404 : ressource introuvable en base de données.
     * <p>
     * Levée par les services quand un findById() ne retourne rien.
     * Exemple : GET /api/projets/999 → projet inexistant.
     * </p>
     *
     * @return HTTP 404 avec le message de l'exception
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFoundException(
            ResourceNotFoundException ex,
            HttpServletRequest request) {

        log.warn("Ressource introuvable : {} | Chemin : {}", ex.getMessage(), request.getRequestURI());

        ApiError error = ApiError.builder()
                .statut(HttpStatus.NOT_FOUND.value())
                .erreur("Ressource introuvable")
                .message(ex.getMessage())
                .chemin(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Gère les erreurs 404 levées par les repositories via NoSuchElementException.
     * (Alternative à ResourceNotFoundException pour les cas simples).
     */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiError> handleNoSuchElementException(
            NoSuchElementException ex,
            HttpServletRequest request) {

        log.warn("Élément introuvable : {} | Chemin : {}", ex.getMessage(), request.getRequestURI());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ApiError.of(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI())
        );
    }

    /**
     * Gère les erreurs 400 liées à des règles métier violées.
     * <p>
     * Exemple : tentative de changer le statut d'une tâche avec une
     * transition invalide (TERMINEE → A_FAIRE sans autorisation).
     * </p>
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        log.warn("Argument invalide : {} | Chemin : {}", ex.getMessage(), request.getRequestURI());

        return ResponseEntity.badRequest().body(
                ApiError.of(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI())
        );
    }

    /**
     * Gère les erreurs 409 liées à un état incohérent.
     * Exemple : assigner une tâche à un utilisateur désactivé.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalStateException(
            IllegalStateException ex,
            HttpServletRequest request) {

        log.warn("État incohérent : {} | Chemin : {}", ex.getMessage(), request.getRequestURI());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                ApiError.of(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI())
        );
    }

    // =========================================================================
    // 2. ERREURS DE VALIDATION (400 Bad Request)
    // =========================================================================

    /**
     * Gère les erreurs de validation Bean Validation (@Valid, @NotBlank, @Email...).
     * <p>
     * Levée quand le corps d'une requête POST/PUT ne respecte pas les contraintes
     * déclarées dans les DTOs avec les annotations de validation.
     * </p>
     * <p>
     * La réponse inclut la liste de TOUS les champs en erreur, ce qui permet
     * au frontend d'afficher les messages directement sous chaque champ du formulaire.
     * </p>
     *
     * @return HTTP 400 avec la liste détaillée des erreurs de validation
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        // Extraire tous les messages d'erreur de validation
        List<String> erreurs = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());

        log.warn("Erreurs de validation ({} champ(s)) | Chemin : {} | Erreurs : {}",
                erreurs.size(), request.getRequestURI(), erreurs);

        ApiError error = ApiError.builder()
                .statut(HttpStatus.BAD_REQUEST.value())
                .erreur("Erreur de validation")
                .message("Les données soumises contiennent " + erreurs.size() + " erreur(s)")
                .chemin(request.getRequestURI())
                .details(erreurs)  // Liste des messages par champ
                .build();

        return ResponseEntity.badRequest().body(error);
    }

    // =========================================================================
    // 3. ERREURS D'AUTHENTIFICATION ET D'AUTORISATION (401 / 403)
    // =========================================================================

    /**
     * Gère les erreurs 401 : identifiants incorrects lors du login.
     * <p>
     * Spring Security lève cette exception si le mot de passe ne correspond
     * pas au hash BCrypt stocké en base de données.
     * </p>
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentialsException(
            BadCredentialsException ex,
            HttpServletRequest request) {

        // Ne jamais révéler si c'est l'email ou le mot de passe qui est incorrect
        // (protection contre l'énumération de comptes)
        log.warn("Tentative de connexion échouée | Chemin : {}", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiError.of(
                        HttpStatus.UNAUTHORIZED,
                        "Email ou mot de passe incorrect",
                        request.getRequestURI()
                )
        );
    }

    /**
     * Gère les erreurs 401 : tentative d'accès avec un compte désactivé.
     * Levée quand {@code Utilisateur.actif = false}.
     */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabledException(
            DisabledException ex,
            HttpServletRequest request) {

        log.warn("Connexion refusée - compte désactivé | Chemin : {}", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiError.of(
                        HttpStatus.UNAUTHORIZED,
                        "Ce compte a été désactivé. Contactez l'administrateur DSI.",
                        request.getRequestURI()
                )
        );
    }

    /**
     * Gère les erreurs 403 : accès refusé (rôle insuffisant).
     * <p>
     * Levée par {@code @PreAuthorize} quand l'utilisateur est authentifié
     * mais n'a pas le rôle requis pour accéder à une ressource.
     * Exemple : un AGENT tente d'accéder à /api/admin.
     * </p>
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(
            AccessDeniedException ex,
            HttpServletRequest request) {

        log.warn("Accès refusé : {} | Chemin : {}", ex.getMessage(), request.getRequestURI());

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiError.of(
                        HttpStatus.FORBIDDEN,
                        "Accès refusé : vous n'avez pas les droits nécessaires pour cette action.",
                        request.getRequestURI()
                )
        );
    }

    // =========================================================================
    // 4. FILET DE SÉCURITÉ : Erreur serveur générique (500)
    // =========================================================================

    /**
     * Intercepte toutes les exceptions non gérées par les handlers précédents.
     * <p>
     * C'est le "catch-all" final. Retourne un 500 Internal Server Error
     * avec un message générique (sans exposer les détails internes).
     * </p>
     * <p>
     * <strong>Important :</strong> le stack trace complet est loggé en ERROR
     * pour faciliter le débogage, mais n'est jamais exposé au client.
     * </p>
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGlobalException(
            Exception ex,
            HttpServletRequest request) {

        // Log complet avec stack trace pour le monitoring/débogage
        log.error("Erreur inattendue | Chemin : {} | Cause : {}", request.getRequestURI(), ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiError.of(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Une erreur interne est survenue. Veuillez réessayer ou contacter l'administrateur.",
                        request.getRequestURI()
                )
        );
    }
}
