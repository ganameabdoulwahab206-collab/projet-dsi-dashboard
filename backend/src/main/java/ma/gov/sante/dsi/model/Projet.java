package ma.gov.sante.dsi.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import ma.gov.sante.dsi.model.enums.StatutProjet;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un projet de la DSI du Ministère de la Santé.
 * <p>
 * Un projet regroupe un ensemble de tâches et est rattaché à un département.
 * Le champ {@code avancement} représente le pourcentage de complétion (0-100).
 * </p>
 *
 * Relations :
 * - Appartient à un {@link Departement} (ManyToOne)
 * - Possède plusieurs {@link Tache} (OneToMany)
 */
@Entity
@Table(name = "projets", indexes = {
        // Index pour filtrer rapidement les projets par statut
        @Index(name = "idx_projet_statut", columnList = "statut"),
        // Index pour filtrer les projets par département
        @Index(name = "idx_projet_departement", columnList = "departement_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"taches"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Projet {

    /** Identifiant unique auto-généré */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Titre du projet (court et descriptif).
     * Exemple : "Migration Infrastructure Cloud"
     */
    @NotBlank(message = "Le titre du projet est obligatoire")
    @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères")
    @Column(name = "titre", nullable = false, length = 200)
    private String titre;

    /**
     * Description détaillée des objectifs et du périmètre du projet.
     */
    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    @Column(name = "description", length = 1000)
    private String description;

    /**
     * Date de début planifiée du projet.
     */
    @Column(name = "date_debut")
    private LocalDate dateDebut;

    /**
     * Date de fin planifiée (deadline) du projet.
     */
    @Column(name = "date_fin")
    private LocalDate dateFin;

    /**
     * Statut actuel du projet.
     * Stocké sous forme de chaîne en base de données pour la lisibilité.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    @Builder.Default
    private StatutProjet statut = StatutProjet.EN_ATTENTE;

    /**
     * Taux d'avancement du projet en pourcentage (0 à 100).
     * Calculé manuellement ou à partir des tâches complétées.
     */
    @Min(value = 0, message = "L'avancement ne peut pas être négatif")
    @Max(value = 100, message = "L'avancement ne peut pas dépasser 100%")
    @Column(name = "avancement", nullable = false)
    @Builder.Default
    private Integer avancement = 0;

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Département responsable de ce projet.
     * ManyToOne : plusieurs projets peuvent appartenir au même département.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "departement_id",
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_projet_departement")
    )
    @JsonIgnoreProperties({"projets", "utilisateurs"})
    private Departement departement;

    /**
     * Liste des tâches composant ce projet.
     * CascadeType.ALL : si le projet est supprimé, ses tâches le sont aussi.
     * orphanRemoval = true : les tâches retirées du projet sont supprimées de la BDD.
     */
    @OneToMany(
            mappedBy = "projet",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties({"projet"})
    @Builder.Default
    private List<Tache> taches = new ArrayList<>();

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /**
     * Ajoute une tâche au projet et met à jour la relation bidirectionnelle.
     *
     * @param tache la tâche à ajouter au projet
     */
    public void ajouterTache(Tache tache) {
        this.taches.add(tache);
        tache.setProjet(this);
    }

    /**
     * Retire une tâche du projet et met à jour la relation bidirectionnelle.
     *
     * @param tache la tâche à retirer du projet
     */
    public void retirerTache(Tache tache) {
        this.taches.remove(tache);
        tache.setProjet(null);
    }

    /**
     * Vérifie si le projet est en retard (date de fin dépassée et non terminé).
     *
     * @return true si le projet est en retard
     */
    @Transient // Non persisté en base, calculé à la volée
    public boolean isEnRetard() {
        return dateFin != null
                && LocalDate.now().isAfter(dateFin)
                && statut != StatutProjet.TERMINE
                && statut != StatutProjet.ANNULE;
    }
}
