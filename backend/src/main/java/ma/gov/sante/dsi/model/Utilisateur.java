package ma.gov.sante.dsi.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
 * Implémente {@link UserDetails} de Spring Security.
 */
@Entity
@Table(name = "utilisateurs", indexes = {
        @Index(name = "idx_utilisateur_email", columnList = "email", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"motDePasse", "taches"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Utilisateur implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 150, message = "Le nom ne peut pas dépasser 150 caractères")
    @Column(name = "nom", nullable = false, length = 150)
    private String nom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    @Column(name = "email", nullable = false, unique = true, length = 200)
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Column(name = "mot_de_passe", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Builder.Default
    @Column(name = "actif", nullable = false)
    private boolean actif = true;

    // =========================================================================
    // RELATIONS
    // =========================================================================

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(
            name = "departement_id",
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_utilisateur_departement")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "utilisateurs", "projets"})
    private Departement departement;

    @OneToMany(
            mappedBy = "utilisateur",
            cascade = {CascadeType.PERSIST, CascadeType.MERGE},
            fetch = FetchType.LAZY
    )
    @JsonIgnore
    @Builder.Default
    private List<Tache> taches = new ArrayList<>();

    // =========================================================================
    // IMPLÉMENTATION DE UserDetails (Spring Security)
    // =========================================================================

    @JsonIgnore
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @JsonIgnore
    @Override
    public String getPassword() {
        return this.motDePasse;
    }

    @JsonIgnore
    @Override
    public String getUsername() {
        return this.email;
    }

    @JsonIgnore
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @JsonIgnore
    @Override
    public boolean isAccountNonLocked() {
        return this.actif;
    }

    @JsonIgnore
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @JsonIgnore
    @Override
    public boolean isEnabled() {
        return this.actif;
    }
}
