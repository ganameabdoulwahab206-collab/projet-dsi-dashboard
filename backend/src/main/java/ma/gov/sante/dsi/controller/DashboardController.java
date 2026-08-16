package ma.gov.sante.dsi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.gov.sante.dsi.dto.DashboardStatsDTO;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.model.enums.Role;
import ma.gov.sante.dsi.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST pour le tableau de bord et les KPIs de la DSI.
 * <p>
 * Base URL : /api/dashboard
 * </p>
 *
 * <p>Ce controller est le cœur de l'application : il alimente les widgets
 * et graphiques du tableau de bord en agrégeant toutes les statistiques
 * pertinentes en un seul appel API optimisé.</p>
 *
 * <h3>Stratégie d'accès :</h3>
 * <ul>
 *   <li><strong>DIRECTEUR</strong> → Statistiques globales de toute la DSI</li>
 *   <li><strong>CHEF_SERVICE</strong> → Statistiques de son département uniquement</li>
 * </ul>
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard KPIs", description = "Indicateurs de performance et statistiques du tableau de bord DSI")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE', 'AGENT')") // Protection au niveau du controller
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Endpoint principal du tableau de bord.
     * <p>
     * Retourne un {@link DashboardStatsDTO} complet contenant tous les KPIs.
     * Le contenu est adapté automatiquement selon le rôle de l'utilisateur :
     * </p>
     *
     * <ul>
     *   <li><strong>DIRECTEUR</strong> : Vision 360° de toute la DSI
     *     <ul>
     *       <li>Total projets toutes directions confondues</li>
     *       <li>Répartition par statut (camembert)</li>
     *       <li>Taux d'avancement moyen global</li>
     *       <li>Tâches critiques en souffrance dans toute la DSI</li>
     *     </ul>
     *   </li>
     *   <li><strong>CHEF_SERVICE</strong> : Vision restreinte à son département
     *     <ul>
     *       <li>Projets de son service uniquement</li>
     *       <li>Taux d'avancement moyen de ses projets</li>
     *       <li>Tâches critiques de son équipe</li>
     *     </ul>
     *   </li>
     * </ul>
     *
     * <p><strong>Exemple de réponse :</strong></p>
     * <pre>
     * {
     *   "totalProjets": 24,
     *   "projetsEnCours": 8,
     *   "projetsTermines": 12,
     *   "projetsEnRetard": 3,
     *   "tauxAvancementMoyen": 62.5,
     *   "tachesCritiquesEnSouffrance": 7,
     *   "totalTaches": 156,
     *   "totalUtilisateursActifs": 45,
     *   "filtreParDepartement": false,
     *   "departement": null
     * }
     * </pre>
     *
     * @param utilisateur l'utilisateur connecté (injecté depuis le token JWT)
     * @return HTTP 200 avec le DTO complet des statistiques
     */
    @GetMapping("/stats")
    @Operation(
        summary = "Statistiques du tableau de bord",
        description = """
            Retourne tous les KPIs du tableau de bord.
            - DIRECTEUR : statistiques globales DSI
            - CHEF_SERVICE : statistiques de son département uniquement
            """
    )
    public ResponseEntity<DashboardStatsDTO> getStats(
            @AuthenticationPrincipal Utilisateur utilisateur) {

        DashboardStatsDTO stats;

        if (utilisateur.getRole() == Role.DIRECTEUR) {
            // Vue Directeur : agrégation globale de toute la DSI
            stats = dashboardService.getStatsGlobales();
        } else if (utilisateur.getRole() == Role.CHEF_SERVICE) {
            // Vue Chef de Service : filtrage par son département
            Long departementId = utilisateur.getDepartement().getId();
            stats = dashboardService.getStatsParDepartement(departementId);
        } else {
            // Vue Agent : filtrage par ses propres tâches ou son département
            stats = dashboardService.getStatsPourAgent(utilisateur);
        }

        return ResponseEntity.ok(stats);
    }

    /**
     * Récupère les statistiques d'un département spécifique.
     * <p>
     * Réservé au Directeur pour comparer les performances entre services.
     * Exemple : GET /api/dashboard/departement/1 → Stats du département SERSI.
     * </p>
     *
     * @param departementId l'identifiant du département à analyser
     * @return les statistiques du département demandé
     */
    @GetMapping("/departement/{departementId}")
    @Operation(
        summary = "Statistiques par département",
        description = "Retourne les KPIs d'un département spécifique (DIRECTEUR uniquement)"
    )
    @PreAuthorize("hasRole('DIRECTEUR')") // Surcharge la règle du controller (plus restrictive)
    public ResponseEntity<DashboardStatsDTO> getStatsParDepartement(
            @PathVariable Long departementId) {

        DashboardStatsDTO stats = dashboardService.getStatsParDepartement(departementId);
        return ResponseEntity.ok(stats);
    }
}
