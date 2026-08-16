package ma.gov.sante.dsi.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.gov.sante.dsi.model.enums.Role;

/**
 * DTO représentant la réponse retournée au client après une authentification réussie.
 * <p>
 * Contient le token JWT à utiliser dans les requêtes suivantes,
 * ainsi que les informations de base de l'utilisateur connecté
 * (évite un second appel au serveur pour récupérer le profil).
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    /**
     * Token JWT d'accès. Le frontend doit l'inclure dans
     * l'en-tête Authorization: Bearer <token> de chaque requête.
     */
    private String accessToken;

    /**
     * Type du token. Toujours "Bearer" dans notre implémentation.
     */
    @Builder.Default
    private String tokenType = "Bearer";

    /**
     * Durée de validité du token en millisecondes.
     */
    private Long expiresIn;

    // ----- Informations de l'utilisateur connecté -----

    /** Identifiant unique de l'utilisateur */
    private Long utilisateurId;

    /** Nom complet de l'utilisateur */
    private String nom;

    /** Email de l'utilisateur */
    private String email;

    /** Rôle déterminant les accès dans l'application */
    private Role role;

    /** Nom du département de l'utilisateur */
    private String departement;

    /** Identifiant du département (utile pour les requêtes d'assignation) */
    private Long departementId;
}
