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

    // ── Profil personnel (tous les utilisateurs connectés) ────────────────────

    @GetMapping("/me")
    @Operation(summary = "Mon profil", description = "Retourne les informations de l'utilisateur connecté")
    public ResponseEntity<Utilisateur> getMonProfil(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Utilisateur utilisateur) {
        return ResponseEntity.ok(utilisateur);
    }

    @PutMapping("/me/profil")
    @Operation(summary = "Modifier mon profil", description = "Permet à l'utilisateur de modifier son propre nom")
    public ResponseEntity<Utilisateur> updateMonProfil(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Utilisateur utilisateur,
            @RequestBody Map<String, String> payload) {
        String nouveauNom = payload.get("nom");
        Utilisateur updated = utilisateurService.updateProfil(utilisateur.getId(), nouveauNom);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/me/mot-de-passe")
    @Operation(summary = "Changer mon mot de passe", description = "Vérifie l'ancien mot de passe puis applique le nouveau")
    public ResponseEntity<Void> changerMotDePasse(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Utilisateur utilisateur,
            @RequestBody Map<String, String> payload) {
        String ancienMdp = payload.get("ancienMotDePasse");
        String nouveauMdp = payload.get("nouveauMotDePasse");
        if (ancienMdp == null || nouveauMdp == null || nouveauMdp.length() < 6) {
            return ResponseEntity.badRequest().build();
        }
        try {
            utilisateurService.changerMotDePasse(utilisateur.getId(), ancienMdp, nouveauMdp);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).build();
        }
    }

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

    @PostMapping
    @Operation(summary = "Créer un nouvel utilisateur (DIRECTEUR)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Utilisateur> creerUtilisateur(@RequestBody Map<String, Object> payload) {
        String nom = (String) payload.get("nom");
        String email = (String) payload.get("email");
        String motDePasse = (String) payload.get("motDePasse");
        String roleStr = (String) payload.get("role");
        Object deptIdObj = payload.get("departementId");
        Long departementId = deptIdObj != null ? Long.valueOf(deptIdObj.toString()) : null;

        if (nom == null || email == null || motDePasse == null || roleStr == null) {
            return ResponseEntity.badRequest().build();
        }

        Utilisateur nouvelUser = Utilisateur.builder()
                .nom(nom)
                .email(email)
                .role(Role.valueOf(roleStr.toUpperCase()))
                .build();

        Utilisateur cree = utilisateurService.creer(nouvelUser, departementId, motDePasse);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(cree);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un utilisateur (DIRECTEUR)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Void> supprimerUtilisateur(@PathVariable Long id) {
        utilisateurService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
