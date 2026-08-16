package ma.gov.sante.dsi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO principal du tableau de bord DSI — retourné par GET /api/dashboard/stats.
 * <p>
 * Ce DTO agrège toutes les statistiques nécessaires à l'affichage du tableau
 * de bord en un seul appel API, évitant de multiples requêtes depuis le frontend.
 * </p>
 *
 * <h3>Utilisé par :</h3>
 * <ul>
 *   <li>La vue Directeur : vision globale de toute la DSI</li>
 *   <li>La vue Chef de Service : statistiques filtrées par département</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {

    // ── SECTION : Statistiques Projets ───────────────────────────────────────

    /** Nombre total de projets enregistrés dans le système */
    private long totalProjets;

    /** Projets planifiés mais pas encore démarrés */
    private long projetsEnAttente;

    /** Projets actuellement en cours d'exécution */
    private long projetsEnCours;

    /** Projets terminés avec succès */
    private long projetsTermines;

    /** Projets dont la date de fin est dépassée (non terminés) — génère des alertes */
    private long projetsEnRetard;

    /** Projets suspendus ou annulés */
    private long projetsSuspendus;

    // ── SECTION : Taux d'avancement global ───────────────────────────────────

    /**
     * Taux d'avancement moyen de tous les projets EN_COURS (en pourcentage).
     * <p>
     * Calculé comme la moyenne des champs {@code avancement} des projets en cours.
     * Affiché sous forme de jauge/progress-bar dans le tableau de bord.
     * </p>
     */
    private double tauxAvancementMoyen;

    // ── SECTION : Statistiques Tâches ────────────────────────────────────────

    /** Nombre total de tâches dans le système */
    private long totalTaches;

    /** Tâches à faire (non démarrées) */
    private long tachesAFaire;

    /** Tâches actuellement en cours de réalisation */
    private long tachesEnCours;

    /** Tâches complétées */
    private long tachesTerminees;

    /**
     * Tâches critiques en souffrance : date d'échéance dépassée ET non terminées.
     * <p>
     * Ce chiffre est mis en évidence dans le tableau de bord pour alerter
     * le Directeur et les Chefs de Service.
     * </p>
     */
    private long tachesCritiquesEnSouffrance;

    /**
     * Tâches bloquées nécessitant une intervention.
     */
    private long tachesBloquees;

    // ── SECTION : Indicateurs d'équipe ───────────────────────────────────────

    /** Nombre total d'utilisateurs actifs dans le système */
    private long totalUtilisateursActifs;

    // ── SECTION : Métadonnées ────────────────────────────────────────────────

    /**
     * Département pour lequel ces stats sont calculées.
     * {@code null} si c'est la vue globale (Directeur).
     */
    private String departement;

    /**
     * Indique si ces statistiques sont filtrées par département.
     */
    private boolean filtreParDepartement;
}
