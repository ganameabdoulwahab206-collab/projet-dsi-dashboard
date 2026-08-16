package ma.gov.sante.dsi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.gov.sante.dsi.model.Projet;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.model.enums.Role;
import ma.gov.sante.dsi.service.ProjetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST pour la gestion des projets DSI.
 * <p>
 * Base URL : /api/projets
 * </p>
 *
 * <h3>Politique d'accès par endpoint :</h3>
 * <ul>
 *   <li>GET /         → DIRECTEUR : tous les projets | CHEF_SERVICE : projets de son département</li>
 *   <li>GET /{id}     → Tous les utilisateurs authentifiés</li>
 *   <li>POST /        → DIRECTEUR et CHEF_SERVICE</li>
 *   <li>PUT /{id}     → DIRECTEUR et CHEF_SERVICE</li>
 *   <li>DELETE /{id}  → DIRECTEUR uniquement</li>
 * </ul>
 */
@RestController
@RequestMapping("/projets")
@RequiredArgsConstructor
@Tag(name = "Projets", description = "Gestion des projets de la DSI")
@SecurityRequirement(name = "bearerAuth") // Swagger : tous les endpoints nécessitent un JWT
public class ProjetController {

    private final ProjetService projetService;

    /**
     * Récupère la liste des projets selon le rôle de l'utilisateur connecté.
     * <p>
     * Logique d'accès différenciée :
     * <ul>
     *   <li><strong>DIRECTEUR</strong> → Voit TOUS les projets de la DSI</li>
     *   <li><strong>CHEF_SERVICE</strong> → Voit uniquement les projets de son département</li>
     *   <li><strong>AGENT</strong> → Accès non autorisé (403)</li>
     * </ul>
     * </p>
     *
     * @param utilisateur l'utilisateur connecté (injecté par Spring Security)
     * @return liste des projets selon les droits
     */
    @GetMapping
    @Operation(summary = "Lister les projets", description = "Retourne les projets selon le rôle de l'utilisateur")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<List<Projet>> listerProjets(
            @AuthenticationPrincipal Utilisateur utilisateur) {

        List<Projet> projets;

        if (utilisateur.getRole() == Role.DIRECTEUR) {
            // Le Directeur voit tous les projets
            projets = projetService.findAll();
        } else {
            // Le Chef de Service ne voit que son département
            Long departementId = utilisateur.getDepartement().getId();
            projets = projetService.findByDepartement(departementId);
        }

        return ResponseEntity.ok(projets);
    }

    /**
     * Récupère les détails d'un projet spécifique par son identifiant.
     * <p>
     * Accessible à tous les utilisateurs authentifiés.
     * </p>
     *
     * @param id l'identifiant du projet
     * @return le projet trouvé ou 404 si inexistant
     */
    @GetMapping("/{id}")
    @Operation(summary = "Détails d'un projet", description = "Retourne les informations complètes d'un projet")
    public ResponseEntity<Projet> getProjetById(@PathVariable Long id) {
        Projet projet = projetService.findById(id);
        return ResponseEntity.ok(projet);
    }

    /**
     * Récupère la liste des projets actuellement en retard (alertes).
     * Réservé au Directeur et aux Chefs de Service pour la gestion des risques.
     *
     * @return liste des projets dont la date de fin est dépassée
     */
    @GetMapping("/en-retard")
    @Operation(summary = "Projets en retard", description = "Liste les projets dont la date de fin est dépassée")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<List<Projet>> getProjetsEnRetard() {
        return ResponseEntity.ok(projetService.findProjetsEnRetard());
    }

    /**
     * Crée un nouveau projet et l'associe à un département.
     * <p>
     * Réservé au Directeur et aux Chefs de Service.
     * L'avancement est initialisé à 0% et le statut à EN_ATTENTE.
     * </p>
     *
     * @param projet        le DTO du projet à créer (validé par @Valid)
     * @param departementId l'identifiant du département responsable (paramètre de requête)
     * @return HTTP 201 Created avec le projet créé
     */
    @PostMapping
    @Operation(summary = "Créer un projet", description = "Crée un nouveau projet et l'associe à un département")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<Projet> creerProjet(
            @Valid @RequestBody Projet projet,
            @RequestParam Long departementId) {

        Projet projetCree = projetService.creer(projet, departementId);
        return ResponseEntity.status(HttpStatus.CREATED).body(projetCree);
    }

    /**
     * Met à jour les informations d'un projet existant.
     * <p>
     * L'avancement est recalculé automatiquement après mise à jour.
     * </p>
     *
     * @param id     l'identifiant du projet à modifier
     * @param projet les nouvelles données du projet
     * @return le projet mis à jour
     */
    @PutMapping("/{id}")
    @Operation(summary = "Modifier un projet", description = "Met à jour les informations d'un projet existant")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<Projet> mettreAJourProjet(
            @PathVariable Long id,
            @Valid @RequestBody Projet projet) {

        Projet projetMisAJour = projetService.mettreAJour(id, projet);
        return ResponseEntity.ok(projetMisAJour);
    }

    /**
     * Recalcule manuellement l'avancement d'un projet.
     * <p>
     * Utile si des tâches ont été modifiées directement en base
     * ou en cas de désynchronisation.
     * </p>
     *
     * @param id l'identifiant du projet
     * @return le projet avec l'avancement recalculé
     */
    @PatchMapping("/{id}/avancement")
    @Operation(
        summary = "Recalculer l'avancement",
        description = "Recalcule le taux d'avancement basé sur le statut des tâches"
    )
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<Projet> recalculerAvancement(@PathVariable Long id) {
        Projet projetMisAJour = projetService.mettreAjourAvancement(id);
        return ResponseEntity.ok(projetMisAJour);
    }

    /**
     * Supprime définitivement un projet et toutes ses tâches associées.
     * <p>
     * Réservé au Directeur uniquement (action irréversible).
     * La suppression en cascade est configurée dans l'entité Projet.
     * </p>
     *
     * @param id l'identifiant du projet à supprimer
     * @return HTTP 204 No Content (pas de corps dans la réponse)
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un projet", description = "Supprime le projet et toutes ses tâches (DIRECTEUR uniquement)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Void> supprimerProjet(@PathVariable Long id) {
        projetService.supprimer(id);
        return ResponseEntity.noContent().build(); // HTTP 204
    }
}
