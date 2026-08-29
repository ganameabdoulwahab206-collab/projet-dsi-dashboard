package ma.gov.sante.dsi.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un département de la DSI du Ministère de la Santé.
 * <p>
 * Exemples de départements : SERSI, SEISAI, SPCP.
 * Un département peut regrouper plusieurs utilisateurs et indicateurs KPI.
 * </p>
 *
 * Relations :
 * - Un département possède plusieurs {@link Utilisateur} (OneToMany)
 * - Un département possède plusieurs {@link Projet} (OneToMany)
 */
@Entity
@Table(name = "departements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"utilisateurs", "projets"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Departement {

    /** Identifiant unique auto-généré */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nom du département (ex : "SERSI", "SEISAI", "SPCP").
     * Doit être unique dans la base de données.
     */
    @NotBlank(message = "Le nom du département est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    @Column(name = "nom", nullable = false, unique = true, length = 100)
    private String nom;

    /**
     * Description détaillée des missions et responsabilités du département.
     */
    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    @Column(name = "description", length = 500)
    private String description;

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Liste des utilisateurs appartenant à ce département.
     */
    @OneToMany(
            mappedBy = "departement",
            cascade = {CascadeType.PERSIST, CascadeType.MERGE},
            fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties({"departement", "taches", "motDePasse"})
    @Builder.Default
    private List<Utilisateur> utilisateurs = new ArrayList<>();

    /**
     * Liste des projets rattachés à ce département.
     */
    @OneToMany(
            mappedBy = "departement",
            cascade = {CascadeType.PERSIST, CascadeType.MERGE},
            fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties({"departement", "taches"})
    @Builder.Default
    private List<Projet> projets = new ArrayList<>();

    // =========================================================================
    // MÉTHODES UTILITAIRES (Helper Methods)
    // =========================================================================

    /**
     * Ajoute un utilisateur au département et met à jour la relation bidirectionnelle.
     *
     * @param utilisateur l'utilisateur à rattacher au département
     */
    public void ajouterUtilisateur(Utilisateur utilisateur) {
        this.utilisateurs.add(utilisateur);
        utilisateur.setDepartement(this);
    }

    /**
     * Ajoute un projet au département et met à jour la relation bidirectionnelle.
     *
     * @param projet le projet à rattacher au département
     */
    public void ajouterProjet(Projet projet) {
        this.projets.add(projet);
        projet.setDepartement(this);
    }
}
