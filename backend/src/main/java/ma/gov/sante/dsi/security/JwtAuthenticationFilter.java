package ma.gov.sante.dsi.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre HTTP interceptant chaque requête pour valider le token JWT.
 * <p>
 * Étend {@link OncePerRequestFilter} garantissant une exécution UNIQUE
 * par requête HTTP (même en cas de forward ou redirect internes).
 * </p>
 *
 * <pre>
 * Flux de traitement pour chaque requête :
 *
 *   Requête HTTP entrante
 *       │
 *       ▼
 *   [1] Lire l'en-tête Authorization
 *       │── Absent ou ne commence pas par "Bearer " ?
 *       │       └─► Passer au filtre suivant (Spring gère le rejet si route protégée)
 *       │
 *       ▼
 *   [2] Extraire le token JWT
 *       │
 *       ▼
 *   [3] Extraire l'email depuis le token
 *       │── Email null ou déjà authentifié ? ──► Passer au filtre suivant
 *       │
 *       ▼
 *   [4] Charger l'utilisateur depuis la BDD via UserDetailsService
 *       │
 *       ▼
 *   [5] Valider le token (signature + expiration)
 *       │── Invalide ? ──► Passer (SecurityContextHolder vide = 403)
 *       │
 *       ▼
 *   [6] Créer l'objet Authentication et l'injecter dans SecurityContextHolder
 *       │
 *       ▼
 *   [7] Passer au filtre suivant (contrôleur appelé si autorisé)
 * </pre>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** Service JWT pour extraire et valider les tokens */
    private final JwtService jwtService;

    /** Service Spring Security pour charger l'utilisateur depuis la BDD */
    private final UserDetailsService userDetailsService;

    /**
     * Méthode principale du filtre : appelée pour chaque requête HTTP.
     *
     * @param request     la requête HTTP entrante
     * @param response    la réponse HTTP sortante
     * @param filterChain la chaîne de filtres à continuer
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // ------------------------------------------------------------------
        // ÉTAPE 1 : Lire l'en-tête Authorization
        // ------------------------------------------------------------------
        // Le frontend envoie le token dans l'en-tête HTTP :
        // Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ...
        final String authHeader = request.getHeader("Authorization");

        // Si l'en-tête est absent ou n'est pas de type Bearer, on passe au filtre suivant.
        // Spring Security gérera le rejet si la route est protégée.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // ------------------------------------------------------------------
        // ÉTAPE 2 : Extraire le token JWT (sans le préfixe "Bearer ")
        // ------------------------------------------------------------------
        final String jwt = authHeader.substring(7); // "Bearer " = 7 caractères

        // ------------------------------------------------------------------
        // ÉTAPE 3 : Extraire l'email (subject) depuis le token
        // ------------------------------------------------------------------
        String userEmail;
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            // Token malformé : laisser Spring Security rejeter la requête
            log.warn("Impossible d'extraire l'email du token JWT : {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        // ------------------------------------------------------------------
        // ÉTAPE 4 : Vérifier qu'on n'a pas déjà authentifié cette session
        // ------------------------------------------------------------------
        // SecurityContextHolder.getContext().getAuthentication() != null
        // signifie que l'utilisateur est déjà authentifié pour cette requête.
        // Inutile de revalider le token.
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // ---------------------------------------------------------------
            // ÉTAPE 5 : Charger l'utilisateur depuis la base de données
            // ---------------------------------------------------------------
            // On interroge la BDD pour s'assurer que l'utilisateur existe encore
            // et est toujours actif (le compte n'a pas été désactivé).
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // ---------------------------------------------------------------
            // ÉTAPE 6 : Valider le token (signature + expiration + cohérence)
            // ---------------------------------------------------------------
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // Créer l'objet d'authentification Spring Security
                // Le 3e paramètre contient les rôles/autorités de l'utilisateur
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,                          // credentials : null (déjà vérifié)
                                userDetails.getAuthorities()  // ex: [ROLE_DIRECTEUR]
                        );

                // Enrichir avec les détails de la requête HTTP (IP, session, etc.)
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // ---------------------------------------------------------------
                // ÉTAPE 7 : Injecter l'authentification dans le SecurityContext
                // ---------------------------------------------------------------
                // Après cette ligne, Spring Security considère l'utilisateur comme
                // authentifié pour toute la durée de traitement de cette requête.
                SecurityContextHolder.getContext().setAuthentication(authToken);

                log.debug("Utilisateur authentifié via JWT : {} | Rôle : {}",
                        userEmail, userDetails.getAuthorities());
            } else {
                log.warn("Token JWT invalide pour l'utilisateur : {}", userEmail);
            }
        }

        // ------------------------------------------------------------------
        // ÉTAPE 8 : Passer au filtre suivant dans la chaîne
        // ------------------------------------------------------------------
        filterChain.doFilter(request, response);
    }
}
