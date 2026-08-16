package ma.gov.sante.dsi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.dto.DashboardStatsDTO;
import ma.gov.sante.dsi.model.enums.StatutProjet;
import ma.gov.sante.dsi.model.enums.StatutTache;
import ma.gov.sante.dsi.repository.DepartementRepository;
import ma.gov.sante.dsi.repository.ProjetRepository;
import ma.gov.sante.dsi.repository.TacheRepository;
import ma.gov.sante.dsi.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Service calculant et agrégeant toutes les statistiques du tableau de bord DSI.
 * <p>
 * Ce service est optimisé pour minimiser le nombre de requêtes SQL en base
 * en utilisant des requêtes de comptage plutôt que de chargement d'entités.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true) // Toutes les méthodes sont en lecture seule
public class DashboardService {

    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final DepartementRepository departementRepository;

    /**
     * Calcule les statistiques globales pour la vue Directeur.
     * <p>
     * Agrège les données de TOUTE la DSI sans filtre de département.
     * </p>
     *
     * @return le DTO complet avec tous les KPIs de la DSI
     */
    public DashboardStatsDTO getStatsGlobales() {
        log.debug("Calcul des statistiques globales du tableau de bord");

        // ── Statistiques Projets ──────────────────────────────────────────────
        long totalProjets   = projetRepository.count();
        long enAttente      = projetRepository.countByStatut(StatutProjet.EN_ATTENTE);
        long enCours        = projetRepository.countByStatut(StatutProjet.EN_COURS);
        long termines       = projetRepository.countByStatut(StatutProjet.TERMINE);
        long suspendus      = projetRepository.countByStatut(StatutProjet.SUSPENDU)
                            + projetRepository.countByStatut(StatutProjet.ANNULE);
        long enRetard       = projetRepository.findProjetsEnRetard(LocalDate.now()).size();

        // ── Taux d'avancement moyen des projets EN_COURS ──────────────────────
        double tauxAvancement = calculerTauxAvancementMoyen();

        // ── Statistiques Tâches ───────────────────────────────────────────────
        long totalTaches     = tacheRepository.count();
        long tachesAFaire    = tacheRepository.countByStatut(StatutTache.A_FAIRE);
        long tachesEnCours   = tacheRepository.countByStatut(StatutTache.EN_COURS);
        long tachesTerminees = tacheRepository.countByStatut(StatutTache.TERMINEE);
        long tachesBloquees  = tacheRepository.countByStatut(StatutTache.BLOQUEE);

        // Tâches critiques en souffrance = EN_ATTENTE + EN_COURS avec date dépassée
        long tachesCritiques = calculerTachesCritiques();

        // ── Statistiques Utilisateurs ─────────────────────────────────────────
        long totalActifs = utilisateurRepository.count(); // Simplification (tous actifs)

        return DashboardStatsDTO.builder()
                .totalProjets(totalProjets)
                .projetsEnAttente(enAttente)
                .projetsEnCours(enCours)
                .projetsTermines(termines)
                .projetsEnRetard(enRetard)
                .projetsSuspendus(suspendus)
                .tauxAvancementMoyen(tauxAvancement)
                .totalTaches(totalTaches)
                .tachesAFaire(tachesAFaire)
                .tachesEnCours(tachesEnCours)
                .tachesTerminees(tachesTerminees)
                .tachesBloquees(tachesBloquees)
                .tachesCritiquesEnSouffrance(tachesCritiques)
                .totalUtilisateursActifs(totalActifs)
                .filtreParDepartement(false)
                .departement(null)
                .build();
    }

    /**
     * Calcule les statistiques filtrées pour un département (vue Chef de Service).
     *
     * @param departementId l'identifiant du département
     * @return le DTO avec les KPIs du département uniquement
     */
    public DashboardStatsDTO getStatsParDepartement(Long departementId) {
        log.debug("Calcul des statistiques pour le département id={}", departementId);

        // Vérifier que le département existe
        var departement = departementRepository.findById(departementId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Département introuvable avec l'id : " + departementId
                ));

        // ── Statistiques Projets filtrées par département ─────────────────────
        long totalProjets = projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.EN_ATTENTE)
                          + projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.EN_COURS)
                          + projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.TERMINE)
                          + projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.SUSPENDU)
                          + projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.ANNULE);

        long enAttente = projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.EN_ATTENTE);
        long enCours   = projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.EN_COURS);
        long termines  = projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.TERMINE);
        long suspendus = projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.SUSPENDU)
                       + projetRepository.countByDepartementIdAndStatut(departementId, StatutProjet.ANNULE);

        // Projets en retard pour ce département
        long enRetard = projetRepository.findByDepartementId(departementId)
                .stream()
                .filter(p -> p.isEnRetard())
                .count();

        // Taux d'avancement moyen des projets EN_COURS de ce département
        double tauxAvancement = projetRepository.findByDepartementIdAndStatut(departementId, StatutProjet.EN_COURS)
                .stream()
                .mapToInt(p -> p.getAvancement())
                .average()
                .orElse(0.0);

        // ── Tâches du département (via les projets) ───────────────────────────
        List<Long> projetIds = projetRepository.findByDepartementId(departementId)
                .stream()
                .map(p -> p.getId())
                .toList();

        long totalTaches     = projetIds.stream().mapToLong(tacheRepository::countByProjetId).sum();
        long tachesTerminees = projetIds.stream()
                .mapToLong(pid -> tacheRepository.countByProjetIdAndStatut(pid, StatutTache.TERMINEE))
                .sum();
        long tachesEnCours = projetIds.stream()
                .mapToLong(pid -> tacheRepository.countByProjetIdAndStatut(pid, StatutTache.EN_COURS))
                .sum();
        long tachesAFaire = projetIds.stream()
                .mapToLong(pid -> tacheRepository.countByProjetIdAndStatut(pid, StatutTache.A_FAIRE))
                .sum();
        long tachesBloquees = projetIds.stream()
                .mapToLong(pid -> tacheRepository.countByProjetIdAndStatut(pid, StatutTache.BLOQUEE))
                .sum();

        // Tâches critiques en souffrance pour ce département
        long tachesCritiques = projetIds.stream()
                .flatMap(pid -> tacheRepository.findByProjetId(pid).stream())
                .filter(t -> t.isEnRetard())
                .count();

        // Utilisateurs actifs du département
        long totalActifs = utilisateurRepository.compterUtilisateursActifsParDepartement(departementId);

        return DashboardStatsDTO.builder()
                .totalProjets(totalProjets)
                .projetsEnAttente(enAttente)
                .projetsEnCours(enCours)
                .projetsTermines(termines)
                .projetsEnRetard(enRetard)
                .projetsSuspendus(suspendus)
                .tauxAvancementMoyen(Math.round(tauxAvancement * 10.0) / 10.0)
                .totalTaches(totalTaches)
                .tachesAFaire(tachesAFaire)
                .tachesEnCours(tachesEnCours)
                .tachesTerminees(tachesTerminees)
                .tachesBloquees(tachesBloquees)
                .tachesCritiquesEnSouffrance(tachesCritiques)
                .totalUtilisateursActifs(totalActifs)
                .filtreParDepartement(true)
                .departement(departement.getNom())
                .build();
    }

    /**
     * Calcule les statistiques pour un Agent.
     * Si l'agent n'a pas de département, on renvoie des stats vides.
     * Sinon, on lui affiche les stats de son département.
     */
    public DashboardStatsDTO getStatsPourAgent(ma.gov.sante.dsi.model.Utilisateur utilisateur) {
        log.debug("Calcul des statistiques pour l'agent id={}", utilisateur.getId());
        
        if (utilisateur.getDepartement() == null) {
            return DashboardStatsDTO.builder()
                .totalProjets(0).projetsEnAttente(0).projetsEnCours(0).projetsTermines(0)
                .projetsEnRetard(0).projetsSuspendus(0).tauxAvancementMoyen(0.0)
                .totalTaches(0).tachesAFaire(0).tachesEnCours(0).tachesTerminees(0)
                .tachesBloquees(0).tachesCritiquesEnSouffrance(0).totalUtilisateursActifs(1)
                .filtreParDepartement(false).departement("Non assigné")
                .build();
        }
        
        return getStatsParDepartement(utilisateur.getDepartement().getId());
    }

    // =========================================================================
    // MÉTHODES PRIVÉES DE CALCUL
    // =========================================================================

    /**
     * Calcule le taux d'avancement moyen de tous les projets EN_COURS.
     * Arrondi à 1 décimale.
     */
    private double calculerTauxAvancementMoyen() {
        double avg = projetRepository.findByStatut(StatutProjet.EN_COURS)
                .stream()
                .mapToInt(p -> p.getAvancement())
                .average()
                .orElse(0.0);
        return Math.round(avg * 10.0) / 10.0;
    }

    /**
     * Calcule le nombre de tâches critiques en souffrance dans toute la DSI.
     * Critère : date d'échéance dépassée ET statut != TERMINEE.
     */
    private long calculerTachesCritiques() {
        return tacheRepository.findAll()
                .stream()
                .filter(t -> t.isEnRetard())
                .count();
    }
}
