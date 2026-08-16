package ma.gov.sante.dsi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.gov.sante.dsi.dto.auth.AuthResponse;
import ma.gov.sante.dsi.dto.auth.LoginRequest;
import ma.gov.sante.dsi.dto.auth.RegisterRequest;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST gérant l'authentification des utilisateurs DSI.
 * <p>
 * Base URL : /api/auth
 * </p>
 *
 * <p>Routes publiques (pas de token JWT requis) :</p>
 * <ul>
 *   <li>POST /api/auth/login → Connexion et obtention du token</li>
 * </ul>
 *
 * <p>Routes protégées (token JWT requis) :</p>
 * <ul>
 *   <li>GET /api/auth/me → Profil de l'utilisateur connecté</li>
 * </ul>
 */
@RestController
@RequestMapping("/auth")
// Note : le context-path "/api" est configuré dans application.properties
// Donc l'URL complète sera : /api/auth/...
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Endpoints de connexion et de gestion du profil")
public class AuthController {

    private final AuthService authService;

    /**
     * Authentifie un utilisateur et retourne un token JWT.
     *
     * <p><strong>Flux :</strong></p>
     * <ol>
     *   <li>Reçoit email + mot de passe dans le corps JSON</li>
     *   <li>Valide les credentials via Spring Security (BCrypt)</li>
     *   <li>Génère et retourne un token JWT valide 24h</li>
     * </ol>
     *
     * <p><strong>Exemple de requête :</strong></p>
     * <pre>
     * POST /api/auth/login
     * Content-Type: application/json
     *
     * {
     *   "email": "directeur@sante.gov.ma",
     *   "motDePasse": "MonMotDePasse123"
     * }
     * </pre>
     *
     * @param request le DTO contenant email et mot de passe (validé par @Valid)
     * @return HTTP 200 avec le token JWT et les infos de l'utilisateur
     */
    @PostMapping("/login")
    @Operation(
        summary = "Connexion utilisateur",
        description = "Authentifie l'utilisateur avec son email et mot de passe, retourne un token JWT Bearer"
    )
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Inscrit un nouvel utilisateur et retourne un token JWT.
     *
     * @param request le DTO contenant les informations du nouvel utilisateur
     * @return HTTP 200 avec le token JWT et les infos de l'utilisateur
     */
    @PostMapping("/register")
    @Operation(
        summary = "Inscription utilisateur",
        description = "Inscrit un nouvel utilisateur et retourne un token JWT Bearer pour la connexion automatique"
    )
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Retourne les informations de profil de l'utilisateur actuellement connecté.
     * <p>
     * {@code @AuthenticationPrincipal} injecte automatiquement l'objet
     * {@link Utilisateur} depuis le {@code SecurityContextHolder}.
     * Pas besoin d'appeler la BDD : Spring Security l'a déjà chargé
     * lors de la validation du token JWT par {@code JwtAuthenticationFilter}.
     * </p>
     *
     * @param utilisateur l'utilisateur authentifié injecté par Spring Security
     * @return HTTP 200 avec les informations du profil (sans le mot de passe)
     */
    @GetMapping("/me")
    @Operation(
        summary = "Profil de l'utilisateur connecté",
        description = "Retourne les informations du compte de l'utilisateur authentifié"
    )
    public ResponseEntity<AuthResponse> getMonProfil(@AuthenticationPrincipal Utilisateur utilisateur) {
        // Construire la réponse à partir de l'objet déjà chargé par Spring Security
        AuthResponse profil = AuthResponse.builder()
                .utilisateurId(utilisateur.getId())
                .nom(utilisateur.getNom())
                .email(utilisateur.getEmail())
                .role(utilisateur.getRole())
                .departement(utilisateur.getDepartement() != null
                        ? utilisateur.getDepartement().getNom()
                        : null)
                .build();

        return ResponseEntity.ok(profil);
    }
}
