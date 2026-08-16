package ma.gov.sante.dsi.repository;

import ma.gov.sante.dsi.model.Tache;
import ma.gov.sante.dsi.model.enums.StatutTache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository Spring Data JPA pour l'entité {@link Tache}.
 * <p>
 * Les méthodes de comptage par statut sont cruciales pour le calcul
 * automatique de l'avancement d'un projet dans {@code ProjetService}.
 * </p>
 */
@Repository
public interface TacheRepository extends JpaRepository<Tache, Long> {

    /**
     * Récupère toutes les tâches d'un projet donné.
     * <p>
     * Utilisé dans {@code ProjetService#mettreAjourAvancement} pour
     * calculer le pourcentage de tâches terminées.
     * </p>
     *
     * @param projetId l'identifiant du projet
     * @return liste de toutes les tâches du projet
     */
    List<Tache> findByProjetId(Long projetId);

    /**
     * Récupère toutes les tâches assignées à un utilisateur.
     * <p>
     * Utilisé dans la vue "Mon Espace" de l'agent/technicien
     * pour afficher son plan de travail.
     * </p>
     *
     * @param utilisateurId l'identifiant de l'utilisateur
     * @return liste des tâches de l'utilisateur
     */
    List<Tache> findByUtilisateurId(Long utilisateurId);

    /**
     * Récupère les tâches d'un utilisateur selon leur statut.
     * Exemple : tâches EN_COURS de l'agent connecté.
     *
     * @param utilisateurId l'identifiant de l'utilisateur
     * @param statut        le statut à filtrer
     * @return liste des tâches filtrées
     */
    List<Tache> findByUtilisateurIdAndStatut(Long utilisateurId, StatutTache statut);

    /**
     * Compte le nombre de tâches d'un projet avec un statut donné.
     * <p>
     * C'est la requête CLÉ pour le calcul de l'avancement :
     *   avancement = (countByProjetIdAndStatut(id, TERMINEE) / countByProjetId(id)) * 100
     * </p>
     * SQL : SELECT COUNT(*) FROM taches WHERE projet_id = ? AND statut = ?
     *
     * @param projetId l'identifiant du projet
     * @param statut   le statut à compter
     * @return nombre de tâches dans cet état pour ce projet
     */
    long countByProjetIdAndStatut(Long projetId, StatutTache statut);

    /**
     * Compte le nombre total de tâches d'un projet (tous statuts confondus).
     * Utilisé en dénominateur dans le calcul du pourcentage d'avancement.
     *
     * @param projetId l'identifiant du projet
     * @return nombre total de tâches du projet
     */
    long countByProjetId(Long projetId);

    /**
     * Compte les tâches de l'ensemble de la DSI par statut.
     * Utilisé pour les KPI globaux du Directeur.
     *
     * @param statut le statut à compter
     * @return nombre total de tâches avec ce statut
     */
    long countByStatut(StatutTache statut);

    /**
     * Récupère les tâches en retard d'un utilisateur.
     * <p>
     * Date d'échéance dépassée + statut différent de TERMINEE.
     * Permet de générer des alertes personnalisées pour l'agent connecté.
     * </p>
     *
     * @param utilisateurId l'identifiant de l'utilisateur
     * @param dateActuelle  la date du jour
     * @return liste des tâches en retard de l'utilisateur
     */
    @Query("""
            SELECT t FROM Tache t
            WHERE t.utilisateur.id = :utilisateurId
              AND t.dateEcheance < :dateActuelle
              AND t.statut != ma.gov.sante.dsi.model.enums.StatutTache.TERMINEE
            ORDER BY t.dateEcheance ASC
            """)
    List<Tache> findTachesEnRetardParUtilisateur(
            @Param("utilisateurId") Long utilisateurId,
            @Param("dateActuelle") LocalDate dateActuelle
    );

    /**
     * Requête JPQL : Récupère un résumé du nombre de tâches par statut pour un projet.
     * <p>
     * Retourne une liste d'Object[] où chaque élément est [StatutTache, count].
     * Utilisé pour afficher le graphique de répartition des tâches d'un projet.
     * </p>
     *
     * @param projetId l'identifiant du projet
     * @return liste de [statut, nombre] pour chaque statut présent
     */
    @Query("""
            SELECT t.statut, COUNT(t)
            FROM Tache t
            WHERE t.projet.id = :projetId
            GROUP BY t.statut
            """)
    List<Object[]> countTachesParStatutEtProjet(@Param("projetId") Long projetId);

    /**
     * Récupère les tâches non assignées d'un projet (utilisateur null).
     * Utile pour alerter le Chef de Service des tâches sans responsable.
     *
     * @param projetId l'identifiant du projet
     * @return liste des tâches sans utilisateur assigné
     */
    @Query("SELECT t FROM Tache t WHERE t.projet.id = :projetId AND t.utilisateur IS NULL")
    List<Tache> findTachesNonAssigneesParProjet(@Param("projetId") Long projetId);
}
