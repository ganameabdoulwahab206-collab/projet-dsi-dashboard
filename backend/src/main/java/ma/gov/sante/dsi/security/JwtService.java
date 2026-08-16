package ma.gov.sante.dsi.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.model.Utilisateur;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service responsable de toute la logique JWT (JSON Web Token).
 * <p>
 * Un token JWT est composé de 3 parties séparées par des points :
 *   1. Header  : algorithme de signature (ex: HS256)
 *   2. Payload : données (claims) — email, rôle, expiration
 *   3. Signature : HMAC-SHA256(header + payload, clé secrète)
 * </p>
 * <p>
 * Flux d'authentification :
 *   Login → generateToken() → client stocke le token →
 *   chaque requête → JwtAuthenticationFilter → validateToken() →
 *   accès accordé ou refusé
 * </p>
 */
@Service
@Slf4j
public class JwtService {

    /**
     * Clé secrète lue depuis application.properties.
     * En production, utiliser une variable d'environnement.
     */
    @Value("${application.jwt.secret}")
    private String secretKey;

    /**
     * Durée de validité du token en millisecondes (ex: 86400000 = 24h).
     */
    @Value("${application.jwt.expiration}")
    private long jwtExpiration;

    // =========================================================================
    // GÉNÉRATION DU TOKEN
    // =========================================================================

    /**
     * Génère un token JWT pour un utilisateur donné.
     * <p>
     * Ajoute des claims personnalisés : rôle, nom, et département
     * pour que le frontend puisse adapter l'affichage sans appel API supplémentaire.
     * </p>
     *
     * @param utilisateur l'utilisateur authentifié
     * @return le token JWT signé (String)
     */
    public String generateToken(Utilisateur utilisateur) {
        // Claims supplémentaires insérés dans le payload du token
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", utilisateur.getRole().name());
        extraClaims.put("nom", utilisateur.getNom());
        extraClaims.put("userId", utilisateur.getId());

        // Ajouter le département si l'utilisateur en a un
        if (utilisateur.getDepartement() != null) {
            extraClaims.put("departement", utilisateur.getDepartement().getNom());
        }

        return buildToken(extraClaims, utilisateur, jwtExpiration);
    }

    /**
     * Méthode interne de construction du token JWT.
     * <p>
     * Structure du token :
     *   - subject (sub) : l'email de l'utilisateur (identifiant unique)
     *   - issuedAt (iat) : timestamp de création
     *   - expiration (exp) : timestamp d'expiration
     *   - claims personnalisés : rôle, nom, userId
     * </p>
     *
     * @param extraClaims claims additionnels à inclure dans le payload
     * @param userDetails l'utilisateur (source du subject)
     * @param expiration  durée de validité en millisecondes
     * @return le token JWT signé sous forme de String
     */
    private String buildToken(Map<String, Object> extraClaims,
                              UserDetails userDetails,
                              long expiration) {
        return Jwts.builder()
                .claims(extraClaims)                           // Claims personnalisés
                .subject(userDetails.getUsername())             // Subject = email
                .issuedAt(new Date(System.currentTimeMillis())) // Date de création
                .expiration(new Date(System.currentTimeMillis() + expiration)) // Expiration
                .signWith(getSigningKey()) // Signature HMAC-SHA256
                .compact();
    }

    // =========================================================================
    // EXTRACTION DES INFORMATIONS DU TOKEN
    // =========================================================================

    /**
     * Extrait le nom d'utilisateur (email) du token JWT.
     * Le subject du token contient l'email de l'utilisateur.
     *
     * @param token le token JWT à analyser
     * @return l'email contenu dans le token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extrait la date d'expiration du token JWT.
     *
     * @param token le token JWT
     * @return la date d'expiration
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Méthode générique pour extraire n'importe quel claim du token.
     * <p>
     * Utilise le pattern Function<Claims, T> pour rester flexible.
     * Exemple : extractClaim(token, claims -> claims.get("role", String.class))
     * </p>
     *
     * @param token          le token JWT
     * @param claimsResolver la fonction d'extraction du claim souhaité
     * @param <T>            le type de la valeur du claim
     * @return la valeur du claim extrait
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parse et retourne tous les claims contenus dans le token.
     * <p>
     * Vérifie implicitement la signature du token : si elle est invalide,
     * une exception {@code JwtException} est levée.
     * </p>
     *
     * @param token le token JWT à parser
     * @return l'objet Claims contenant toutes les données du payload
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey()) // Clé pour vérifier la signature
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // =========================================================================
    // VALIDATION DU TOKEN
    // =========================================================================

    /**
     * Valide un token JWT par rapport aux informations d'un utilisateur.
     * <p>
     * Deux conditions doivent être réunies :
     *   1. Le subject du token (email) correspond à l'utilisateur chargé
     *   2. Le token n'est pas expiré
     * </p>
     *
     * @param token       le token JWT reçu dans la requête HTTP
     * @param userDetails l'utilisateur chargé depuis la base de données
     * @return true si le token est valide pour cet utilisateur
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (Exception e) {
            // En cas de token malformé, expiré ou signature invalide
            log.warn("Token JWT invalide : {}", e.getMessage());
            return false;
        }
    }

    /**
     * Vérifie si le token est expiré.
     *
     * @param token le token JWT
     * @return true si la date d'expiration est dans le passé
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // =========================================================================
    // CLÉS DE SIGNATURE
    // =========================================================================

    /**
     * Génère la clé de signature HMAC-SHA256 à partir du secret configuré.
     * <p>
     * La clé secrète est encodée en Base64 dans application.properties.
     * {@code Decoders.BASE64.decode} la convertit en tableau de bytes,
     * puis {@code Keys.hmacShaKeyFor} crée un objet Key compatible JJWT.
     * </p>
     *
     * @return la clé HMAC utilisée pour signer et vérifier les tokens
     */
    private SecretKey getSigningKey() {
        // La clé est du texte brut dans application.properties (pas du Base64)
        // On utilise directement les bytes UTF-8 pour créer la clé HMAC
        byte[] keyBytes = secretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Retourne la durée de validité configurée (en ms).
     * Exposée pour l'inclure dans la réponse d'authentification.
     *
     * @return durée d'expiration en millisecondes
     */
    public long getJwtExpiration() {
        return jwtExpiration;
    }
}
