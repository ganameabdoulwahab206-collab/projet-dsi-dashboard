package ma.gov.sante.dsi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.dto.auth.AuthResponse;
import ma.gov.sante.dsi.dto.auth.LoginRequest;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.repository.UtilisateurRepository;
import ma.gov.sante.dsi.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ma.gov.sante.dsi.dto.auth.RegisterRequest;
import ma.gov.sante.dsi.model.enums.Role;

/**
 * Service gérant l'authentification des utilisateurs de l'application DSI Dashboard.
 * <p>
 * Responsabilité unique : valider les credentials et retourner un token JWT.
 * </p>
 *
 * <h3>Flux de login :</h3>
 * <pre>
 *   [Client]  POST /api/auth/login { email, motDePasse }
 *       │
 *       ▼
 *   [AuthController] → authService.login(request)
 *       │
 *       ▼
 *   [AuthenticationManager.authenticate()]
 *   → charge UserDetails via UserDetailsServiceImpl (BDD)
 *   → compare motDePasse avec le hash BCrypt
 *   → lève BadCredentialsException si invalide
 *       │
 *       ▼
 *   [JwtService.generateToken(utilisateur)]
 *   → Crée le token signé avec email + rôle + nom
 *       │
 *       ▼
 *   [AuthResponse] → renvoyé au client
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    /** Gestionnaire d'authentification Spring Security (délègue à DaoAuthenticationProvider) */
    private final AuthenticationManager authenticationManager;

    /** Service JWT pour la génération du token après authentification */
    private final JwtService jwtService;

    /** Repository pour récupérer l'entité complète après authentification */
    private final UtilisateurRepository utilisateurRepository;

    /** Encodeur pour crypter le mot de passe lors de l'inscription */
    private final PasswordEncoder passwordEncoder;

    /**
     * Authentifie un utilisateur et retourne un token JWT.
     * <p>
     * Étapes détaillées :
     * <ol>
     *   <li>Créer un objet d'authentification non vérifié avec email + motDePasse</li>
     *   <li>Déléguer à AuthenticationManager qui :
     *     <ul>
     *       <li>Charge l'utilisateur depuis la BDD (via UserDetailsService)</li>
     *       <li>Compare le mot de passe fourni avec le hash BCrypt</li>
     *       <li>Lève {@code BadCredentialsException} si invalide</li>
     *     </ul>
     *   </li>
     *   <li>Si valide : générer le JWT et construire la réponse</li>
     * </ol>
     * </p>
     *
     * @param request le DTO contenant email et mot de passe
     * @return {@link AuthResponse} avec le token JWT et les infos de l'utilisateur
     * @throws BadCredentialsException si les credentials sont incorrects
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        log.info("Tentative de connexion pour l'email : {}", request.getEmail());

        // ── ÉTAPE 1 : Déléguer l'authentification à Spring Security ──────────
        // UsernamePasswordAuthenticationToken en mode "non authentifié"
        // (credentials fournis, mais pas encore vérifiés)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),       // username = email
                        request.getMotDePasse()   // password en clair (comparé au BCrypt)
                )
        );
        // Si on arrive ici, l'authentification a réussi.
        // En cas d'échec, Spring lève BadCredentialsException automatiquement.

        // ── ÉTAPE 2 : Récupérer l'entité Utilisateur complète ────────────────
        // Le principal de l'Authentication est notre objet UserDetails (Utilisateur).
        // On le cast directement car Utilisateur implémente UserDetails.
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();

        log.info("Connexion réussie pour : {} | Rôle : {}", utilisateur.getEmail(), utilisateur.getRole());

        // ── ÉTAPE 3 : Générer le token JWT ───────────────────────────────────
        String jwtToken = jwtService.generateToken(utilisateur);

        // ── ÉTAPE 4 : Construire et retourner la réponse ─────────────────────
        return AuthResponse.builder()
                .accessToken(jwtToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .utilisateurId(utilisateur.getId())
                .nom(utilisateur.getNom())
                .email(utilisateur.getEmail())
                .role(utilisateur.getRole())
                .departement(utilisateur.getDepartement() != null
                        ? utilisateur.getDepartement().getNom()
                        : null)
                .departementId(utilisateur.getDepartement() != null
                        ? utilisateur.getDepartement().getId()
                        : null)
                .build();
    }

    /**
     * Inscrit un nouvel utilisateur dans le système.
     *
     * @param request les informations du nouvel utilisateur
     * @return AuthResponse contenant le JWT et les infos pour se connecter directement
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Tentative d'inscription pour l'email : {}", request.getEmail());

        // 1. Vérifier si l'email existe déjà
        if (utilisateurRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Cet email est déjà utilisé.");
        }

        // 2. Définir le rôle (AGENT par défaut si non spécifié)
        Role role = request.getRole() != null ? request.getRole() : Role.AGENT;

        // 3. Créer le nouvel utilisateur
        Utilisateur nouvelUtilisateur = Utilisateur.builder()
                .nom(request.getNom())
                .email(request.getEmail())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .role(role)
                .actif(true) // Actif par défaut
                .build();

        // 4. Sauvegarder en base de données
        utilisateurRepository.save(nouvelUtilisateur);

        log.info("Inscription réussie pour : {}", request.getEmail());

        // 5. Générer le token JWT
        String jwtToken = jwtService.generateToken(nouvelUtilisateur);

        // 6. Retourner la réponse
        return AuthResponse.builder()
                .accessToken(jwtToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .utilisateurId(nouvelUtilisateur.getId())
                .nom(nouvelUtilisateur.getNom())
                .email(nouvelUtilisateur.getEmail())
                .role(nouvelUtilisateur.getRole())
                .departement(null) // Pas de département assigné à l'inscription
                .build();
    }
}
