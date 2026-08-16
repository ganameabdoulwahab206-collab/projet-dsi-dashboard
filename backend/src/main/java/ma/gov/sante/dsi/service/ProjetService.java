package ma.gov.sante.dsi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.model.Projet;
import ma.gov.sante.dsi.model.enums.StatutProjet;
import ma.gov.sante.dsi.model.enums.StatutTache;
import ma.gov.sante.dsi.repository.DepartementRepository;
import ma.gov.sante.dsi.repository.ProjetRepository;
import ma.gov.sante.dsi.repository.TacheRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Service métier pour la gestion des projets de la DSI.
 * <p>
 * Responsabilités principales :
 * <ul>
 *   <li>CRUD complet sur les projets</li>
 *   <li>Calcul automatique du taux d'avancement basé sur les tâches</li>
 *   <li>Détection des projets en retard pour les alertes</li>
 * </ul>
 * </p>
 *
 * <p>Les annotations {@code @PreAuthorize} assurent le contrôle d'accès
 * au niveau méthode (nécessite {@code @EnableMethodSecurity} dans SecurityConfig).</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional // Toutes les méthodes sont transactionnelles par défaut
public class ProjetService {

    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;
    private final DepartementRepository departementRepository;

    // =========================================================================
    // CRUD — LECTURE
    // =========================================================================

    /**
     * Récupère tous les projets (tous départements confondus).
     * Réservé au Directeur pour la vue globale.
     *
     * @return liste de tous les projets
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('DIRECTEUR')")
    public List<Projet> findAll() {
        return projetRepository.findAll();
    }

    /**
     * Récupère les projets d'un département spécifique.
     * Accessible par le Chef de Service (son département) et le Directeur.
     *
     * @param departementId l'identifiant du département
     * @return liste des projets du département
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public List<Projet> findByDepartement(Long departementId) {
        return projetRepository.findByDepartementId(departementId);
    }

    /**
     * Récupère un projet par son identifiant.
     *
     * @param id l'identifiant du projet
     * @return le projet trouvé
     * @throws NoSuchElementException si aucun projet n'a cet identifiant
     */
    @Transactional(readOnly = true)
    public Projet findById(Long id) {
        return projetRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException(
                        "Projet introuvable avec l'id : " + id
                ));
    }

    /**
     * Récupère les projets en retard (alerte tableau de bord).
     *
     * @return liste des projets dont la date de fin est dépassée
     */
    @Transactional(readOnly = true)
    public List<Projet> findProjetsEnRetard() {
        return projetRepository.findProjetsEnRetard(LocalDate.now());
    }

    // =========================================================================
    // CRUD — ÉCRITURE
    // =========================================================================

    /**
     * Crée un nouveau projet et l'associe à un département.
     *
     * @param projet        l'entité projet à persister
     * @param departementId l'identifiant du département responsable
     * @return le projet créé avec son identifiant généré
     */
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public Projet creer(Projet projet, Long departementId) {
        // Vérifier que le département existe
        var departement = departementRepository.findById(departementId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Département introuvable avec l'id : " + departementId
                ));

        projet.setDepartement(departement);
        projet.setStatut(StatutProjet.EN_ATTENTE);
        projet.setAvancement(0);

        Projet projetSauvegarde = projetRepository.save(projet);
        log.info("Nouveau projet créé : '{}' (id={}) pour le département '{}'",
                projetSauvegarde.getTitre(), projetSauvegarde.getId(), departement.getNom());

        return projetSauvegarde;
    }

    /**
     * Met à jour les informations d'un projet existant.
     * L'avancement et le statut sont recalculés automatiquement après mise à jour.
     *
     * @param id     l'identifiant du projet à modifier
     * @param source l'objet contenant les nouvelles valeurs
     * @return le projet mis à jour
     */
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public Projet mettreAJour(Long id, Projet source) {
        Projet existant = findById(id);

        // Mise à jour des champs modifiables
        existant.setTitre(source.getTitre());
        existant.setDescription(source.getDescription());
        existant.setDateDebut(source.getDateDebut());
        existant.setDateFin(source.getDateFin());

        // Le statut peut être changé manuellement par le chef de service
        if (source.getStatut() != null) {
            existant.setStatut(source.getStatut());
        }

        return projetRepository.save(existant);
    }

    /**
     * Supprime un projet et toutes ses tâches (cascade configurée dans l'entité).
     *
     * @param id l'identifiant du projet à supprimer
     */
    @PreAuthorize("hasRole('DIRECTEUR')")
    public void supprimer(Long id) {
        Projet projet = findById(id);
        projetRepository.delete(projet);
        log.info("Projet supprimé : '{}' (id={})", projet.getTitre(), id);
    }

    // =========================================================================
    // LOGIQUE MÉTIER CLEF : Calcul de l'avancement
    // =========================================================================

    /**
     * Recalcule et met à jour le pourcentage d'avancement d'un projet.
     * <p>
     * <strong>Algorithme :</strong>
     * <pre>
     *   avancement (%) = (nbTachesTerminees / nbTachesTotales) × 100
     * </pre>
     *
     * Cas particuliers gérés :
     * <ul>
     *   <li>Projet sans tâches → avancement = 0%</li>
     *   <li>Toutes tâches TERMINÉES → avancement = 100% + statut = TERMINE</li>
     *   <li>Projet ANNULE ou SUSPENDU → avancement inchangé</li>
     * </ul>
     *
     * Mise à jour automatique du statut selon l'avancement :
     * <ul>
     *   <li>0%   → EN_ATTENTE</li>
     *   <li>1-99% → EN_COURS</li>
     *   <li>100% → TERMINE</li>
     * </ul>
     * </p>
     *
     * @param projetId l'identifiant du projet à recalculer
     * @return le projet avec l'avancement mis à jour
     */
    public Projet mettreAjourAvancement(Long projetId) {
        Projet projet = findById(projetId);

        // Cas particulier : ne pas recalculer si le projet est annulé ou suspendu
        if (projet.getStatut() == StatutProjet.ANNULE ||
            projet.getStatut() == StatutProjet.SUSPENDU) {
            log.debug("Avancement non recalculé pour le projet {} (statut: {})",
                    projetId, projet.getStatut());
            return projet;
        }

        // ── Étape 1 : Compter le nombre total de tâches du projet ────────────
        long totalTaches = tacheRepository.countByProjetId(projetId);

        if (totalTaches == 0) {
            // Aucune tâche → avancement reste à 0
            log.debug("Projet {} : aucune tâche, avancement = 0%", projetId);
            projet.setAvancement(0);
            projet.setStatut(StatutProjet.EN_ATTENTE);
            return projetRepository.save(projet);
        }

        // ── Étape 2 : Compter les tâches avec le statut TERMINEE ─────────────
        long tachesTerminees = tacheRepository.countByProjetIdAndStatut(
                projetId, StatutTache.TERMINEE
        );

        // ── Étape 3 : Calculer le pourcentage ────────────────────────────────
        // Multiplication par 100.0 (double) pour éviter la division entière
        int avancement = (int) Math.round((tachesTerminees * 100.0) / totalTaches);

        log.info("Projet '{}' (id={}) : {}/{} tâches terminées → avancement = {}%",
                projet.getTitre(), projetId, tachesTerminees, totalTaches, avancement);

        projet.setAvancement(avancement);

        // ── Étape 4 : Mettre à jour le statut selon l'avancement ─────────────
        if (avancement == 0) {
            projet.setStatut(StatutProjet.EN_ATTENTE);
        } else if (avancement == 100) {
            // Toutes les tâches sont terminées → le projet est terminé
            projet.setStatut(StatutProjet.TERMINE);
            log.info("Projet '{}' (id={}) automatiquement marqué comme TERMINÉ",
                    projet.getTitre(), projetId);
        } else {
            // Entre 1% et 99% → projet en cours
            projet.setStatut(StatutProjet.EN_COURS);
        }

        return projetRepository.save(projet);
    }

    // =========================================================================
    // STATISTIQUES POUR LE TABLEAU DE BORD
    // =========================================================================

    /**
     * Retourne le nombre de projets par statut pour le widget KPI du Directeur.
     * <p>
     * Format de retour utilisable pour alimenter un graphique (ex: Recharts PieChart).
     * </p>
     *
     * @return tableau de [statut, nombre]
     */
    @Transactional(readOnly = true)
    public long[] compterParStatut() {
        return new long[]{
            projetRepository.countByStatut(StatutProjet.EN_ATTENTE),
            projetRepository.countByStatut(StatutProjet.EN_COURS),
            projetRepository.countByStatut(StatutProjet.SUSPENDU),
            projetRepository.countByStatut(StatutProjet.TERMINE),
            projetRepository.countByStatut(StatutProjet.ANNULE)
        };
    }
}
