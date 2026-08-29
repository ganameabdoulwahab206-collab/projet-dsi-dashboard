package ma.gov.sante.dsi.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import ma.gov.sante.dsi.model.enums.StatutTache;

import java.time.LocalDate;

/**
 * Entité représentant une tâche assignée à un utilisateur dans le cadre d'un projet.
 * <p>
 * Une tâche est l'unité de travail de base dans le système DSI Dashboard.
 * Elle est obligatoirement liée à un {@link Projet} et à un {@link Utilisateur}.
 * </p>
 *
 * Relations :
 * - Appartient à un {@link Projet} (ManyToOne)
 * - Est assignée à un {@link Utilisateur} (ManyToOne)
 */
@Entity
@Table(name = "taches", indexes = {
        // Index pour filtrer les tâches par projet
        @Index(name = "idx_tache_projet", columnList = "projet_id"),
        // Index pour filtrer les tâches par utilisateur
        @Index(name = "idx_tache_utilisateur", columnList = "utilisateur_id"),
        // Index pour filtrer les tâches par statut
        @Index(name = "idx_tache_statut", columnList = "statut")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"projet", "utilisateur"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Tache {

    /** Identifiant unique auto-généré */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Description de la tâche à réaliser.
     * Doit être suffisamment détaillée pour guider l'exécution.
     */
    @NotBlank(message = "La description de la tâche est obligatoire")
    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    @Column(name = "description", nullable = false, length = 500)
    private String description;

    /**
     * Date limite pour compléter la tâche.
     * Peut être dans le futur ou aujourd'hui (validation Bean Validation).
     */
    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    /**
     * Statut actuel de la tâche.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    @Builder.Default
    private StatutTache statut = StatutTache.A_FAIRE;

    /**
     * Niveau de priorité de la tâche (1 = Basse, 2 = Moyenne, 3 = Haute, 4 = Critique).
     */
    @Column(name = "priorite", nullable = false)
    @Builder.Default
    private Integer priorite = 2; // Priorité moyenne par défaut

    // =========================================================================
    // RELATIONS
    // =========================================================================

    /**
     * Projet auquel appartient cette tâche.
     * La tâche ne peut pas exister sans projet (relation obligatoire).
     * ManyToOne : plusieurs tâches peuvent appartenir au même projet.
     */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(
            name = "projet_id",
            referencedColumnName = "id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_tache_projet")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "taches", "departement"})
    private Projet projet;

    /**
     * Utilisateur (agent/technicien) responsable de cette tâche.
     * ManyToOne : plusieurs tâches peuvent être assignées au même utilisateur.
     * optional = true : une tâche peut être non assignée (en attente d'affectation).
     */
    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(
            name = "utilisateur_id",
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_tache_utilisateur")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "taches", "motDePasse", "departement", "authorities"})
    private Utilisateur utilisateur;

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /**
     * Vérifie si la tâche est en retard (date d'échéance dépassée et non terminée).
     *
     * @return true si la tâche est en retard
     */
    @Transient // Non persisté en base, calculé à la volée
    public boolean isEnRetard() {
        return dateEcheance != null
                && LocalDate.now().isAfter(dateEcheance)
                && statut != StatutTache.TERMINEE;
    }

    /**
     * Vérifie si la tâche est assignée à un utilisateur.
     *
     * @return true si la tâche a un responsable
     */
    @Transient
    public boolean isAssignee() {
        return utilisateur != null;
    }
}
