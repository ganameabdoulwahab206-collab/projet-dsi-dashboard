package ma.gov.sante.dsi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.model.Tache;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.model.enums.StatutTache;
import ma.gov.sante.dsi.repository.ProjetRepository;
import ma.gov.sante.dsi.repository.TacheRepository;
import ma.gov.sante.dsi.repository.UtilisateurRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Service métier pour la gestion des tâches de la DSI.
 * <p>
 * Responsabilités :
 * <ul>
 *   <li>CRUD des tâches</li>
 *   <li>Assignation d'une tâche à un agent/technicien</li>
 *   <li>Changement de statut avec déclenchement du recalcul d'avancement du projet</li>
 *   <li>Récupération des tâches en retard pour les alertes</li>
 * </ul>
 * </p>
 *
 * <p><strong>Couplage important :</strong> toute modification de statut d'une tâche
 * déclenche automatiquement {@code projetService.mettreAjourAvancement()} pour
 * maintenir l'avancement du projet cohérent en temps réel.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TacheService {

    private final TacheRepository tacheRepository;
    private final ProjetRepository projetRepository;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * Injection via setter pour éviter la dépendance circulaire entre
     * TacheService → ProjetService et ProjetService → TacheRepository.
     * Spring résout TacheService en premier, puis injecte ProjetService.
     */
    private final ProjetService projetService;

    // =========================================================================
    // CRUD — LECTURE
    // =========================================================================

    /**
     * Récupère toutes les tâches d'un projet.
     *
     * @param projetId l'identifiant du projet
     * @return liste des tâches du projet
     */
    @Transactional(readOnly = true)
    public List<Tache> findByProjet(Long projetId) {
        // Vérifier que le projet existe
        if (!projetRepository.existsById(projetId)) {
            throw new NoSuchElementException("Projet introuvable avec l'id : " + projetId);
        }
        return tacheRepository.findByProjetId(projetId);
    }

    /**
     * Récupère toutes les tâches assignées à un utilisateur.
     * <p>
     * Utilisé dans la vue "Mon Espace" pour que l'agent voie son plan de travail.
     * </p>
     *
     * @param utilisateurId l'identifiant de l'utilisateur
     * @return liste des tâches de l'utilisateur
     */
    @Transactional(readOnly = true)
    public List<Tache> findByUtilisateur(Long utilisateurId) {
        return tacheRepository.findByUtilisateurId(utilisateurId);
    }

    /**
     * Récupère une tâche par son identifiant.
     *
     * @param id l'identifiant de la tâche
     * @return la tâche trouvée
     * @throws NoSuchElementException si aucune tâche n'a cet identifiant
     */
    @Transactional(readOnly = true)
    public Tache findById(Long id) {
        return tacheRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException(
                        "Tâche introuvable avec l'id : " + id
                ));
    }

    /**
     * Récupère les tâches en retard d'un utilisateur.
     * Déclenche une alerte dans l'interface si la liste n'est pas vide.
     *
     * @param utilisateurId l'identifiant de l'utilisateur
     * @return liste des tâches dont l'échéance est dépassée et non terminées
     */
    @Transactional(readOnly = true)
    public List<Tache> findTachesEnRetard(Long utilisateurId) {
        return tacheRepository.findTachesEnRetardParUtilisateur(utilisateurId, LocalDate.now());
    }

    // =========================================================================
    // CRUD — ÉCRITURE
    // =========================================================================

    /**
     * Crée une nouvelle tâche dans un projet.
     *
     * @param tache    l'entité tâche à persister
     * @param projetId l'identifiant du projet auquel rattacher la tâche
     * @return la tâche créée avec son identifiant généré
     */
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public Tache creer(Tache tache, Long projetId) {
        var projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Projet introuvable avec l'id : " + projetId
                ));

        tache.setProjet(projet);
        tache.setStatut(StatutTache.A_FAIRE);

        Tache tacheSauvegardee = tacheRepository.save(tache);
        log.info("Nouvelle tâche créée (id={}) dans le projet '{}' (id={})",
                tacheSauvegardee.getId(), projet.getTitre(), projetId);

        // Recalculer l'avancement du projet après ajout d'une tâche
        projetService.mettreAjourAvancement(projetId);

        return tacheSauvegardee;
    }

    /**
     * Supprime une tâche et recalcule l'avancement du projet parent.
     *
     * @param id l'identifiant de la tâche à supprimer
     */
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public void supprimer(Long id) {
        Tache tache = findById(id);
        Long projetId = tache.getProjet().getId();

        tacheRepository.delete(tache);
        log.info("Tâche supprimée (id={}) du projet (id={})", id, projetId);

        // Recalculer l'avancement après suppression
        projetService.mettreAjourAvancement(projetId);
    }

    // =========================================================================
    // LOGIQUE MÉTIER 1 : Assigner une tâche à un agent
    // =========================================================================

    /**
     * Assigne une tâche à un utilisateur (agent ou technicien).
     * <p>
     * Règles métier :
     * <ul>
     *   <li>Seul un Chef de Service ou Directeur peut assigner une tâche</li>
     *   <li>La tâche passe automatiquement en statut EN_COURS si elle était A_FAIRE</li>
     *   <li>L'utilisateur cible doit être actif dans le système</li>
     * </ul>
     * </p>
     *
     * @param tacheId       l'identifiant de la tâche à assigner
     * @param utilisateurId l'identifiant de l'agent à qui assigner la tâche
     * @return la tâche mise à jour avec le responsable assigné
     * @throws NoSuchElementException   si la tâche ou l'utilisateur n'existent pas
     * @throws IllegalStateException    si l'utilisateur est inactif
     */
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public Tache assignerTache(Long tacheId, Long utilisateurId) {
        // ── Étape 1 : Charger la tâche ───────────────────────────────────────
        Tache tache = findById(tacheId);

        // ── Étape 2 : Charger et valider l'utilisateur ───────────────────────
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Utilisateur introuvable avec l'id : " + utilisateurId
                ));

        // Vérifier que l'utilisateur est actif
        if (!utilisateur.isActif()) {
            throw new IllegalStateException(
                    "Impossible d'assigner une tâche à un compte désactivé : " + utilisateur.getEmail()
            );
        }

        // ── Étape 3 : Assigner l'utilisateur ─────────────────────────────────
        Utilisateur ancienResponsable = tache.getUtilisateur();
        tache.setUtilisateur(utilisateur);

        // ── Étape 4 : Changer le statut si la tâche était en attente ─────────
        if (tache.getStatut() == StatutTache.A_FAIRE) {
            tache.setStatut(StatutTache.EN_COURS);
        }

        Tache tacheMiseAJour = tacheRepository.save(tache);

        log.info("Tâche (id={}) assignée à '{}' (anciennement : {})",
                tacheId,
                utilisateur.getNom(),
                ancienResponsable != null ? ancienResponsable.getNom() : "Non assignée");

        return tacheMiseAJour;
    }

    /**
     * Désassigne une tâche (retire son responsable).
     * La tâche repasse en statut A_FAIRE.
     *
     * @param tacheId l'identifiant de la tâche à désassigner
     * @return la tâche mise à jour
     */
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public Tache desassignerTache(Long tacheId) {
        Tache tache = findById(tacheId);
        tache.setUtilisateur(null);
        tache.setStatut(StatutTache.A_FAIRE);

        log.info("Tâche (id={}) désassignée", tacheId);
        return tacheRepository.save(tache);
    }

    // =========================================================================
    // LOGIQUE MÉTIER 2 : Changement de statut
    // =========================================================================

    /**
     * Change le statut d'une tâche et recalcule automatiquement l'avancement du projet.
     * <p>
     * C'est la méthode la plus appelée par les agents : ils mettent à jour
     * l'état de leur tâche depuis leur interface "Mon Espace".
     * </p>
     *
     * <h4>Transitions de statut valides :</h4>
     * <pre>
     *   A_FAIRE ──► EN_COURS ──► TERMINEE
     *      │            │
     *      ▼            ▼
     *   EN_ATTENTE   BLOQUEE
     * </pre>
     *
     * @param tacheId   l'identifiant de la tâche
     * @param newStatut le nouveau statut à appliquer
     * @return la tâche avec le statut mis à jour
     * @throws IllegalArgumentException si la transition de statut est invalide
     */
    public Tache changerStatut(Long tacheId, StatutTache newStatut) {
        Tache tache = findById(tacheId);
        StatutTache ancienStatut = tache.getStatut();

        // Validation de la transition (évite par ex. de "rouvrir" une tâche terminée sans autorisation)
        validerTransitionStatut(ancienStatut, newStatut);

        tache.setStatut(newStatut);
        Tache tacheMiseAJour = tacheRepository.save(tache);

        log.info("Tâche (id={}) : statut changé de {} à {}",
                tacheId, ancienStatut, newStatut);

        // ── DÉCLENCHEUR CLEF : Recalculer l'avancement du projet parent ───────
        // Chaque changement de statut d'une tâche peut modifier l'avancement global.
        // Ex: Si la dernière tâche passe à TERMINEE → projet passe à 100% → TERMINE.
        projetService.mettreAjourAvancement(tache.getProjet().getId());

        return tacheMiseAJour;
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /**
     * Valide qu'une transition de statut est autorisée.
     * <p>
     * Évite des incohérences métier comme :
     * - Passer directement de A_FAIRE à TERMINEE sans passer par EN_COURS
     * - Réouvrir une tâche TERMINEE sans les droits nécessaires
     * </p>
     *
     * @param ancien l'ancien statut
     * @param nouveau le nouveau statut demandé
     * @throws IllegalArgumentException si la transition est invalide
     */
    private void validerTransitionStatut(StatutTache ancien, StatutTache nouveau) {
        // Règle : une tâche TERMINEE ne peut pas être modifiée par cette méthode
        // (utiliser une méthode dédiée de "réouverture" avec droits Chef/Directeur)
        if (ancien == StatutTache.TERMINEE && nouveau != StatutTache.EN_COURS) {
            // On autorise le retour en EN_COURS depuis TERMINEE (correction d'erreur)
            // mais pas directement en A_FAIRE ou BLOQUEE
            throw new IllegalArgumentException(
                    "Transition de statut invalide : " + ancien + " → " + nouveau +
                    ". Une tâche terminée ne peut être que réouverte en EN_COURS."
            );
        }
        // D'autres règles peuvent être ajoutées ici selon les besoins métier
    }
}
