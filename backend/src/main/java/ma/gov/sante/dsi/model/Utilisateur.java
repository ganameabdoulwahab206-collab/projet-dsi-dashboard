package ma.gov.sante.dsi.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import ma.gov.sante.dsi.model.enums.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Entité représentant un utilisateur du système DSI Dashboard.
 * <p>
 * Implémente {@link UserDetails} de Spring Security pour permettre
 * l'authentification et l'autorisation via JWT.
 * </p>
 *
 * Relations :
 * - Appartient à un {@link Departement} (ManyToOne)
 * - Possède plusieurs {@link Tache} assignées (OneToMany)
 * - Possède plusieurs {@link Activite} saisies (OneToMany)
 */
@Entity
@Table(name = "utilisateurs", indexes = {
        // Index pour accélérer la recherche par email (utilisé lors du login)
        @Index(name = "idx_utilisateur_email", columnList = "email", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"motDePasse", "taches", "activites"}) // Ne jamais logger les mots de passe
public class Utilisateur implements UserDetails {

    /** Identifiant unique auto-généré */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nom complet de l'utilisateur (prénom + nom).
     * Exemple : "Mohammed Alami"
     */
    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 150, message = "Le nom ne peut pas dépasser 150 caractères")
    @Column(name = "nom", nullable = false, length = 150)
    private String nom;

    /**
     * Adresse email professionnelle (utilisée comme identifiant de connexion).
     * Doit être unique dans le système.
     */
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    @Column(name = "email", nullable = false, unique = true, length = 200)
    private String email;

    /**
     * Mot de passe haché (BCrypt).
     * Ne jamais stocker le mot de passe en clair !
     */
    @NotBlank(message = "Le mot de passe est obligatoire")
    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    /**
     * Rôle de l'utilisateur dans le système.
     * Stocké sous forme de chaîne de caractères dans la base de données.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    /**
     * Indique si le compte est actif ou désactivé.
     * Permet de bloquer un compte sans le supprimer.
     */
    @Builder.Default
    @Column(name = "actif", nullable = false)
    private boolean actif = true;

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Département auquel appartient l'utilisateur.
     * Relation ManyToOne : plusieurs utilisateurs peuvent appartenir au même département.
     * FetchType.LAZY : le département est chargé uniquement si on y accède.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "departement_id",
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_utilisateur_departement")
    )
    @JsonIgnoreProperties({"utilisateurs", "projets"})
    private Departement departement;

    /**
     * Tâches assignées à cet utilisateur.
     */
    @OneToMany(
            mappedBy = "utilisateur",
            cascade = {CascadeType.PERSIST, CascadeType.MERGE},
            fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties({"utilisateur", "projet", "commentaires"})
    @Builder.Default
    private List<Tache> taches = new ArrayList<>();

    // =========================================================================
    // IMPLÉMENTATION DE UserDetails (Spring Security)
    // =========================================================================

    /**
     * Retourne les autorités/rôles de l'utilisateur pour Spring Security.
     * Convention Spring : préfixer les rôles avec "ROLE_".
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    /**
     * Retourne le mot de passe haché (utilisé par Spring Security).
     */
    @Override
    public String getPassword() {
        return this.motDePasse;
    }

    /**
     * Retourne le nom d'utilisateur (l'email ici) pour Spring Security.
     */
    @Override
    public String getUsername() {
        return this.email;
    }

    /**
     * Le compte n'expire jamais (à personnaliser si besoin).
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Le compte n'est pas verrouillé (géré via le champ 'actif').
     */
    @Override
    public boolean isAccountNonLocked() {
        return this.actif;
    }

    /**
     * Les credentials n'expirent jamais (à personnaliser si besoin).
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Le compte est actif si le champ 'actif' est vrai.
     */
    @Override
    public boolean isEnabled() {
        return this.actif;
    }
}
