package ma.gov.sante.dsi.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration Swagger / OpenAPI 3.0 pour la documentation de l'API DSI Dashboard.
 * <p>
 * Accessible via : <a href="http://localhost:8080/api/swagger-ui/index.html">
 *     http://localhost:8080/api/swagger-ui/index.html
 * </a>
 * </p>
 *
 * <h3>Fonctionnalité JWT dans Swagger UI :</h3>
 * <p>
 * Cette configuration ajoute un bouton "Authorize 🔒" dans Swagger UI.
 * Pour tester les endpoints protégés directement depuis le navigateur :
 * <ol>
 *   <li>Appeler POST /api/auth/login → copier l'accessToken reçu</li>
 *   <li>Cliquer sur "Authorize 🔒" en haut de la page Swagger</li>
 *   <li>Saisir : <strong>Bearer eyJhbGciOi...</strong> (avec le préfixe "Bearer ")</li>
 *   <li>Cliquer "Authorize" → tous les endpoints protégés sont maintenant testables</li>
 * </ol>
 * </p>
 */
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "DSI Dashboard API",
        version = "1.0.0",
        description = """
            API REST du tableau de bord de suivi des activités de la
            **Direction des Systèmes d'Information (DSI)** du Ministère de la Santé.
            
            ## Authentification
            Tous les endpoints (sauf `/auth/login`) nécessitent un token JWT Bearer.
            
            **Étapes :**
            1. Appeler `POST /auth/login` avec vos identifiants
            2. Copier la valeur de `accessToken` dans la réponse
            3. Cliquer sur **Authorize** et saisir `Bearer <votre_token>`
            
            ## Rôles et accès
            | Rôle | Accès |
            |------|-------|
            | DIRECTEUR | Vision globale, export, admin |
            | CHEF_SERVICE | Son département, validation KPIs |
            | AGENT | Saisie tâches et activités |
            """,
        contact = @Contact(
            name  = "Équipe DSI - Ministère de la Santé",
            email = "dsi@sante.gov.ma"
        ),
        license = @License(
            name = "Usage interne - Ministère de la Santé du Maroc"
        )
    ),
    servers = {
        @Server(url = "/",       description = "Serveur de développement local"),
        @Server(url = "/staging", description = "Serveur de pré-production")
    }
)
public class OpenApiConfig {

    /**
     * Nom du schéma de sécurité JWT référencé dans les annotations des controllers.
     * Ce nom doit correspondre exactement à {@code @SecurityRequirement(name = "bearerAuth")}.
     */
    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    /**
     * Configure OpenAPI avec le schéma d'authentification JWT Bearer.
     * <p>
     * Le schéma de sécurité "bearerAuth" est défini ici et référencé
     * par {@code @SecurityRequirement(name = "bearerAuth")} dans chaque controller.
     * </p>
     * <p>
     * Type : HTTP Bearer → Swagger affiche le champ "Value: Bearer ..."
     * </p>
     *
     * @return la configuration OpenAPI complète avec JWT
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                // Composant de sécurité : définit le schéma JWT Bearer
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, jwtSecurityScheme())
                )
                // Applique le schéma JWT globalement à tous les endpoints
                // (les endpoints publics peuvent le surcharger avec @SecurityRequirement(name=""))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
    }

    /**
     * Définit le schéma de sécurité JWT Bearer pour Swagger.
     * <p>
     * Configuration :
     * <ul>
     *   <li>Type : HTTP (standard HTTP authentication)</li>
     *   <li>Scheme : bearer (indique le type "Bearer")</li>
     *   <li>BearerFormat : JWT (informatif, pour la documentation)</li>
     *   <li>In : HEADER (le token est dans l'en-tête Authorization)</li>
     * </ul>
     * </p>
     *
     * @return le schéma de sécurité JWT configuré
     */
    private SecurityScheme jwtSecurityScheme() {
        return new SecurityScheme()
                .name(SECURITY_SCHEME_NAME)
                .type(SecurityScheme.Type.HTTP)         // Type d'authentification HTTP
                .scheme("bearer")                        // Scheme : Bearer
                .bearerFormat("JWT")                     // Format : JWT (documentaire)
                .in(SecurityScheme.In.HEADER)            // Emplacement : en-tête HTTP
                .description(
                    "Entrez votre token JWT avec le préfixe 'Bearer '. \n\n" +
                    "Exemple : `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ...`\n\n" +
                    "Obtenez votre token via POST /api/auth/login"
                );
    }
}
