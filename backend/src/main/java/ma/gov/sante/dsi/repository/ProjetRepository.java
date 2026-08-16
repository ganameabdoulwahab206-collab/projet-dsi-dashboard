package ma.gov.sante.dsi.repository;

import ma.gov.sante.dsi.model.Projet;
import ma.gov.sante.dsi.model.enums.StatutProjet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository Spring Data JPA pour l'entité {@link Projet}.
 * <p>
 * Fournit des requêtes métier pour le tableau de bord :
 * filtrage par département, statut, projets en retard, etc.
 * </p>
 */
@Repository
public interface ProjetRepository extends JpaRepository<Projet, Long> {

    /**
     * Récupère tous les projets d'un département donné.
     * <p>
     * Utilisé dans la vue Chef de Service pour afficher
     * uniquement les projets de son propre service.
     * </p>
     * SQL : SELECT * FROM projets WHERE departement_id = ?
     *
     * @param departementId l'identifiant du département
     * @return liste des projets du département
     */
    List<Projet> findByDepartementId(Long departementId);

    /**
     * Récupère tous les projets d'un département avec un statut particulier.
     * Exemple : tous les projets EN_COURS du département SERSI.
     *
     * @param departementId l'identifiant du département
     * @param statut        le statut à filtrer
     * @return liste des projets filtrés
     */
    List<Projet> findByDepartementIdAndStatut(Long departementId, StatutProjet statut);

    /**
     * Récupère tous les projets ayant un statut donné.
     * Utile pour le Directeur qui visualise tous les projets EN_COURS ou EN_ATTENTE.
     *
     * @param statut le statut recherché
     * @return liste des projets avec ce statut
     */
    List<Projet> findByStatut(StatutProjet statut);

    /**
     * Compte le nombre de projets par statut dans toute la DSI.
     * <p>
     * Utilisé pour afficher le widget KPI "Répartition des projets" dans le
     * tableau de bord du Directeur (données pour graphique camembert).
     * </p>
     *
     * @param statut le statut à compter
     * @return nombre de projets avec ce statut
     */
    long countByStatut(StatutProjet statut);

    /**
     * Compte le nombre de projets par statut dans un département spécifique.
     *
     * @param departementId l'identifiant du département
     * @param statut        le statut à compter
     * @return nombre de projets du département avec ce statut
     */
    long countByDepartementIdAndStatut(Long departementId, StatutProjet statut);

    /**
     * Requête JPQL : Récupère les projets en retard (date de fin dépassée et non terminés).
     * <p>
     * Utilisé pour générer des alertes automatiques sur le tableau de bord.
     * On exclut les statuts TERMINE et ANNULE.
     * </p>
     *
     * @param dateActuelle la date du jour (LocalDate.now())
     * @return liste des projets en retard
     */
    @Query("""
            SELECT p FROM Projet p
            WHERE p.dateFin < :dateActuelle
              AND p.statut NOT IN (
                  ma.gov.sante.dsi.model.enums.StatutProjet.TERMINE,
                  ma.gov.sante.dsi.model.enums.StatutProjet.ANNULE
              )
            ORDER BY p.dateFin ASC
            """)
    List<Projet> findProjetsEnRetard(@Param("dateActuelle") LocalDate dateActuelle);

    /**
     * Requête JPQL : Récupère les projets dont l'avancement est inférieur au seuil donné.
     * <p>
     * Exemple d'appel : findProjetsAvancementInsuffisant(50, LocalDate.now().minusDays(30))
     * → Projets démarrés depuis plus de 30 jours avec moins de 50% d'avancement.
     * </p>
     *
     * @param seuilAvancement pourcentage d'avancement maximum (ex: 30 pour < 30%)
     * @param dateDebut       date de début minimum (filtre les projets récemment lancés)
     * @return liste des projets sous-performants
     */
    @Query("""
            SELECT p FROM Projet p
            WHERE p.avancement < :seuilAvancement
              AND p.dateDebut <= :dateDebut
              AND p.statut = ma.gov.sante.dsi.model.enums.StatutProjet.EN_COURS
            ORDER BY p.avancement ASC
            """)
    List<Projet> findProjetsAvancementInsuffisant(
            @Param("seuilAvancement") int seuilAvancement,
            @Param("dateDebut") LocalDate dateDebut
    );
}
