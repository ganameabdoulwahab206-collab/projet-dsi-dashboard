package ma.gov.sante.dsi.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuration centrale de Spring Security pour l'application DSI Dashboard.
 * <p>
 * Cette classe remplace l'ancienne configuration XML et s'appuie sur
 * le modèle Spring Security 6 avec {@code SecurityFilterChain}.
 * </p>
 *
 * <h3>Architecture de sécurité :</h3>
 * <pre>
 *   Requête HTTP
 *       │
 *       ▼
 *   [JwtAuthenticationFilter]  ← Notre filtre JWT personnalisé
 *       │
 *       ▼
 *   [UsernamePasswordAuthenticationFilter]  ← Filtre Spring standard
 *       │
 *       ▼
 *   [SecurityFilterChain]  ← Règles d'autorisation (qui accède à quoi)
 *       │
 *       ▼
 *   [Controller]
 * </pre>
 *
 * <h3>Principe STATELESS :</h3>
 * Pas de session HTTP côté serveur. Chaque requête doit porter son propre
 * token JWT. C'est adapté aux API REST consommées par un frontend React.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Active @PreAuthorize/@PostAuthorize sur les méthodes de service
@RequiredArgsConstructor
public class SecurityConfig {

    /** Notre filtre JWT à insérer avant le filtre d'authentification standard */
    private final JwtAuthenticationFilter jwtAuthFilter;

    /** Notre implémentation de UserDetailsService (charge depuis la BDD) */
    private final UserDetailsServiceImpl userDetailsService;

    /** Origines CORS autorisées depuis application.properties */
    @Value("${application.cors.allowed-origins}")
    private String[] allowedOrigins;

    // =========================================================================
    // BEAN PRINCIPAL : SecurityFilterChain
    // =========================================================================

    /**
     * Configure la chaîne de filtres de sécurité HTTP.
     * <p>
     * Règles d'accès appliquées dans l'ordre déclaré :
     * <ul>
     *   <li><strong>Routes publiques</strong> : /api/auth/**, Swagger, H2-console</li>
     *   <li><strong>Routes DIRECTEUR</strong> : /api/admin/**, /api/dashboard/**</li>
     *   <li><strong>Routes CHEF_SERVICE</strong> : /api/kpi/**, validation rapports</li>
     *   <li><strong>Toutes les autres</strong> : authentification requise</li>
     * </ul>
     * </p>
     *
     * @param http l'objet de configuration HttpSecurity
     * @return la chaîne de filtres configurée
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ------------------------------------------------------------------
            // 1. DÉSACTIVER CSRF
            // ------------------------------------------------------------------
            // CSRF (Cross-Site Request Forgery) est inutile avec JWT + STATELESS
            // car il n'y a pas de cookie de session à voler.
            .csrf(AbstractHttpConfigurer::disable)

            // ------------------------------------------------------------------
            // 2. CONFIGURATION CORS
            // ------------------------------------------------------------------
            // Autorise les requêtes cross-origin du frontend React
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ------------------------------------------------------------------
            // 3. RÈGLES D'AUTORISATION DES ROUTES
            // ------------------------------------------------------------------
            .authorizeHttpRequests(auth -> auth

                // ── Routes PUBLIQUES (sans authentification) ──────────────────
                // Note : Spring Security évalue le chemin SANS le context-path (/api)
                .requestMatchers("/auth/**").permitAll()

                // Documentation Swagger (à restreindre en production)
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/api-docs/**",
                    "/api-docs"
                ).permitAll()

                // ── Routes réservées au DIRECTEUR ────────────────────────────
                .requestMatchers("/admin/**").hasRole("DIRECTEUR")

                // ── Routes pour DIRECTEUR et CHEF_SERVICE ────────────────────
                .requestMatchers("/kpi/**")
                    .hasAnyRole("DIRECTEUR", "CHEF_SERVICE")

                .requestMatchers(HttpMethod.DELETE, "/projets/**")
                    .hasAnyRole("DIRECTEUR", "CHEF_SERVICE")

                .requestMatchers(HttpMethod.DELETE, "/taches/**")
                    .hasAnyRole("DIRECTEUR", "CHEF_SERVICE")

                // ── Toutes les autres routes : authentification requise ───────
                .anyRequest().authenticated()
            )

            // ------------------------------------------------------------------
            // 4. POLITIQUE DE SESSION : STATELESS
            // ------------------------------------------------------------------
            // Aucune session HTTP n'est créée ni utilisée.
            // Chaque requête est autonome et doit fournir son token JWT.
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ------------------------------------------------------------------
            // 5. FOURNISSEUR D'AUTHENTIFICATION
            // ------------------------------------------------------------------
            // Indique à Spring Security comment valider les credentials.
            .authenticationProvider(authenticationProvider())

            // ------------------------------------------------------------------
            // 6. INSERTION DU FILTRE JWT
            // ------------------------------------------------------------------
            // Notre filtre JWT doit s'exécuter AVANT le filtre standard
            // UsernamePasswordAuthenticationFilter pour intercepter les requêtes.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // =========================================================================
    // BEANS DE CONFIGURATION
    // =========================================================================

    /**
     * Configure la source CORS pour autoriser les requêtes du frontend React.
     * <p>
     * En développement : http://localhost:3000 (CRA) ou http://localhost:5173 (Vite).
     * En production : remplacer par l'URL de production du frontend.
     * </p>
     *
     * @return la configuration CORS enregistrée pour toutes les routes
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Origines autorisées (lues depuis application.properties)
        configuration.setAllowedOriginPatterns(Arrays.asList(allowedOrigins));

        // Méthodes HTTP autorisées
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // En-têtes autorisés dans les requêtes (dont Authorization pour JWT)
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));

        // En-têtes exposés dans les réponses
        configuration.setExposedHeaders(List.of("Authorization"));

        // Autorise les cookies/credentials dans les requêtes cross-origin
        configuration.setAllowCredentials(true);

        // Durée de mise en cache des résultats CORS preflight (1 heure)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Appliquer à toutes les routes
        return source;
    }

    /**
     * Fournisseur d'authentification DAO (Database Authentication Object).
     * <p>
     * Connecte Spring Security à notre base de données :
     * <ul>
     *   <li>Charge l'utilisateur depuis la BDD via {@code UserDetailsService}</li>
     *   <li>Compare le mot de passe fourni avec le hash BCrypt stocké</li>
     * </ul>
     * </p>
     *
     * @return le fournisseur d'authentification configuré
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        // Source des utilisateurs : notre UserDetailsServiceImpl
        authProvider.setUserDetailsService(userDetailsService);

        // Encodeur utilisé pour comparer les mots de passe
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    /**
     * Encodeur de mots de passe BCrypt.
     * <p>
     * BCrypt est l'algorithme recommandé car il est :
     * - Résistant aux attaques par force brute (coût configurable)
     * - Salé automatiquement (pas de doubles identiques en BDD)
     * </p>
     * La force par défaut est 10 (environ 100ms par hash sur machine moderne).
     *
     * @return l'encodeur BCrypt
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * L'AuthenticationManager est utilisé dans {@code AuthService}
     * pour déclencher le processus d'authentification lors du login.
     *
     * @param config la configuration d'authentification Spring
     * @return le gestionnaire d'authentification
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}
