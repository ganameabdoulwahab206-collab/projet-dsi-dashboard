package ma.gov.sante.dsi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.model.enums.Role;
import ma.gov.sante.dsi.service.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/utilisateurs")
@RequiredArgsConstructor
@Tag(name = "Utilisateurs", description = "Gestion des utilisateurs de la DSI")
@SecurityRequirement(name = "bearerAuth")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    // ── Accessible à DIRECTEUR et CHEF_SERVICE ────────────────────────────────

    @GetMapping("/departement/{departementId}")
    @Operation(summary = "Lister les membres actifs d'un département")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<List<Utilisateur>> getUtilisateursParDepartement(@PathVariable Long departementId) {
        return ResponseEntity.ok(utilisateurService.findByDepartementId(departementId));
    }

    // ── Réservé au DIRECTEUR uniquement ──────────────────────────────────────

    @GetMapping
    @Operation(summary = "Lister tous les utilisateurs (DIRECTEUR)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<List<Utilisateur>> getAllUtilisateurs() {
        return ResponseEntity.ok(utilisateurService.findAll());
    }

    @PutMapping("/{id}/departement")
    @Operation(summary = "Affecter un utilisateur à un département (DIRECTEUR)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Utilisateur> changerDepartement(
            @PathVariable Long id,
            @RequestBody Map<String, Long> payload) {
        Long departementId = payload.get("departementId");
        if (departementId == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(utilisateurService.changerDepartement(id, departementId));
    }

    @PutMapping("/{id}/role")
    @Operation(summary = "Modifier le rôle d'un utilisateur (DIRECTEUR)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Utilisateur> changerRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String roleStr = payload.get("role");
        if (roleStr == null) return ResponseEntity.badRequest().build();
        try {
            Role role = Role.valueOf(roleStr.toUpperCase());
            return ResponseEntity.ok(utilisateurService.changerRole(id, role));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/actif")
    @Operation(summary = "Activer / Désactiver un compte utilisateur (DIRECTEUR)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Utilisateur> toggleActif(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.toggleActif(id));
    }
}
