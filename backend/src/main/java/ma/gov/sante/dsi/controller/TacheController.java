package ma.gov.sante.dsi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.gov.sante.dsi.model.Tache;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.model.enums.StatutTache;
import ma.gov.sante.dsi.service.TacheService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import ma.gov.sante.dsi.model.Commentaire;
import ma.gov.sante.dsi.service.CommentaireService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller REST pour la gestion des tâches.
 * <p>
 * Base URL : /api/taches
 * </p>
 *
 * <h3>Endpoints clés :</h3>
 * <ul>
 *   <li>POST /               → Créer une tâche dans un projet</li>
 *   <li>GET /mes-taches      → Tâches de l'utilisateur connecté (vue agent)</li>
 *   <li>GET /projet/{id}     → Toutes les tâches d'un projet</li>
 *   <li>PUT /{id}/statut     → Changer le statut (déclenche recalcul avancement)</li>
 *   <li>PUT /{id}/assigner   → Assigner la tâche à un agent</li>
 *   <li>DELETE /{id}         → Supprimer une tâche</li>
 * </ul>
 */
@RestController
@RequestMapping("/taches")
@RequiredArgsConstructor
@Tag(name = "Tâches", description = "Gestion des tâches associées aux projets DSI")
@SecurityRequirement(name = "bearerAuth")
public class TacheController {

    private final TacheService tacheService;
    private final CommentaireService commentaireService;

    /**
     * Récupère toutes les tâches d'un projet spécifique.
     *
     * @param projetId l'identifiant du projet
     * @return liste des tâches du projet
     */
    @GetMapping("/projet/{projetId}")
    @Operation(summary = "Tâches d'un projet", description = "Liste toutes les tâches d'un projet donné")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<List<Tache>> getTachesParProjet(@PathVariable Long projetId) {
        return ResponseEntity.ok(tacheService.findByProjet(projetId));
    }

    /**
     * Récupère les tâches de l'utilisateur connecté (vue "Mon Espace").
     * <p>
     * Accessible à tous les utilisateurs authentifiés.
     * L'identifiant est extrait du token JWT via {@code @AuthenticationPrincipal}.
     * </p>
     *
     * @param utilisateur l'utilisateur connecté (injecté par Spring Security)
     * @return liste des tâches assignées à l'utilisateur
     */
    @GetMapping("/mes-taches")
    @Operation(
        summary = "Mes tâches",
        description = "Retourne les tâches assignées à l'utilisateur authentifié"
    )
    public ResponseEntity<List<Tache>> getMesTaches(
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(tacheService.findByUtilisateur(utilisateur.getId()));
    }

    /**
     * Récupère les tâches en retard de l'utilisateur connecté.
     * Utilisé pour afficher les alertes dans l'interface de l'agent.
     *
     * @param utilisateur l'utilisateur connecté
     * @return liste des tâches en retard
     */
    @GetMapping("/mes-taches/en-retard")
    @Operation(summary = "Mes tâches en retard", description = "Retourne les tâches dont l'échéance est dépassée")
    public ResponseEntity<List<Tache>> getMesTachesEnRetard(
            @AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(tacheService.findTachesEnRetard(utilisateur.getId()));
    }

    /**
     * Récupère une tâche par son identifiant.
     *
     * @param id l'identifiant de la tâche
     * @return la tâche ou 404
     */
    @GetMapping("/{id}")
    @Operation(summary = "Détails d'une tâche")
    public ResponseEntity<Tache> getTacheById(@PathVariable Long id) {
        return ResponseEntity.ok(tacheService.findById(id));
    }

    /**
     * Crée une nouvelle tâche dans un projet.
     * <p>
     * L'avancement du projet parent est automatiquement recalculé après création.
     * </p>
     *
     * @param tache    la tâche à créer (validée par @Valid)
     * @param projetId l'identifiant du projet cible (paramètre de requête)
     * @return HTTP 201 avec la tâche créée
     */
    @PostMapping
    @Operation(
        summary = "Créer une tâche",
        description = "Crée une tâche dans un projet et recalcule l'avancement du projet"
    )
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<Tache> creerTache(
            @Valid @RequestBody Tache tache,
            @RequestParam Long projetId) {

        Tache tacheCree = tacheService.creer(tache, projetId);
        return ResponseEntity.status(HttpStatus.CREATED).body(tacheCree);
    }

    /**
     * Modifie le statut d'une tâche.
     * <p>
     * <strong>Point clé :</strong> Ce changement déclenche automatiquement
     * le recalcul de l'avancement du projet parent dans {@code TacheService}.
     * Si la dernière tâche passe à TERMINEE, le projet passe à 100% → TERMINE.
     * </p>
     *
     * <p><strong>Corps de la requête :</strong></p>
     * <pre>
     * PUT /api/taches/5/statut
     * { "statut": "TERMINEE" }
     * </pre>
     *
     * @param id      l'identifiant de la tâche
     * @param payload JSON contenant le nouveau statut : {"statut": "TERMINEE"}
     * @return la tâche avec le statut mis à jour
     */
    @PutMapping("/{id}/statut")
    @Operation(
        summary = "Changer le statut d'une tâche",
        description = "Met à jour le statut et recalcule automatiquement l'avancement du projet parent"
    )
    public ResponseEntity<Tache> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {

        // Extraire le statut depuis le body JSON {"statut": "TERMINEE"}
        String statutStr = payload.get("statut");
        if (statutStr == null || statutStr.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        StatutTache nouveauStatut;
        try {
            nouveauStatut = StatutTache.valueOf(statutStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Statut inconnu : retourner 400 avec les valeurs valides
            return ResponseEntity.badRequest().build();
        }

        Tache tacheMiseAJour = tacheService.changerStatut(id, nouveauStatut);
        return ResponseEntity.ok(tacheMiseAJour);
    }

    /**
     * Assigne une tâche à un agent ou technicien.
     * <p>
     * La tâche passe automatiquement en statut EN_COURS si elle était A_FAIRE.
     * Réservé au Directeur et aux Chefs de Service.
     * </p>
     *
     * <p><strong>Corps de la requête :</strong></p>
     * <pre>
     * PUT /api/taches/5/assigner
     * { "utilisateurId": 12 }
     * </pre>
     *
     * @param id      l'identifiant de la tâche
     * @param payload JSON contenant l'id de l'utilisateur : {"utilisateurId": 12}
     * @return la tâche avec l'utilisateur assigné
     */
    @PutMapping("/{id}/assigner")
    @Operation(
        summary = "Assigner une tâche à un agent",
        description = "Assigne un responsable à la tâche. La tâche passe automatiquement en EN_COURS"
    )
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<Tache> assignerTache(
            @PathVariable Long id,
            @RequestBody Map<String, Long> payload) {

        Long utilisateurId = payload.get("utilisateurId");
        if (utilisateurId == null) {
            return ResponseEntity.badRequest().build();
        }

        Tache tacheMiseAJour = tacheService.assignerTache(id, utilisateurId);
        return ResponseEntity.ok(tacheMiseAJour);
    }

    /**
     * Désassigne une tâche (retire son responsable).
     * La tâche repasse en statut A_FAIRE.
     *
     * @param id l'identifiant de la tâche
     * @return la tâche désassignée
     */
    @PutMapping("/{id}/desassigner")
    @Operation(summary = "Désassigner une tâche", description = "Retire le responsable et remet la tâche en A_FAIRE")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<Tache> desassignerTache(@PathVariable Long id) {
        return ResponseEntity.ok(tacheService.desassignerTache(id));
    }

    /**
     * Supprime une tâche et recalcule l'avancement du projet parent.
     *
     * @param id l'identifiant de la tâche à supprimer
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une tâche")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<Void> supprimerTache(@PathVariable Long id) {
        tacheService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // COMMENTAIRES
    // =========================================================================

    @GetMapping("/{id}/commentaires")
    @Operation(summary = "Lister les commentaires d'une tâche")
    public ResponseEntity<List<Commentaire>> getCommentaires(@PathVariable Long id) {
        return ResponseEntity.ok(commentaireService.findByTache(id));
    }

    @PostMapping("/{id}/commentaires")
    @Operation(summary = "Ajouter un commentaire à une tâche")
    public ResponseEntity<Commentaire> ajouterCommentaire(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        
        String contenu = payload.get("contenu");
        if (contenu == null || contenu.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Commentaire commentaire = commentaireService.ajouterCommentaire(id, utilisateur.getId(), contenu);
        return ResponseEntity.status(HttpStatus.CREATED).body(commentaire);
    }
}
