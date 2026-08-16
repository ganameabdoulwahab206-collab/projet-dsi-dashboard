package ma.gov.sante.dsi.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO (Data Transfer Object) pour la requête de connexion.
 * <p>
 * Reçu depuis le frontend lors du POST /api/auth/login.
 * Ne contient que les champs nécessaires à l'authentification,
 * sans exposer les détails internes de l'entité Utilisateur.
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /**
     * Email professionnel servant d'identifiant de connexion.
     */
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    /**
     * Mot de passe en clair (sera comparé au hash BCrypt en base).
     */
    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;
}
