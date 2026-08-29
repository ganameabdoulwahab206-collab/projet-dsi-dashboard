package ma.gov.sante.dsi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.gov.sante.dsi.model.Departement;
import ma.gov.sante.dsi.service.DepartementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departements")
@RequiredArgsConstructor
@Tag(name = "Départements", description = "Gestion des départements de la DSI")
@SecurityRequirement(name = "bearerAuth")
public class DepartementController {

    private final DepartementService departementService;

    @GetMapping
    @Operation(summary = "Lister tous les départements")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE', 'AGENT')")
    public ResponseEntity<List<Departement>> getAllDepartements() {
        return ResponseEntity.ok(departementService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détails d'un département")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<Departement> getDepartementById(@PathVariable Long id) {
        return ResponseEntity.ok(departementService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Créer un département (DIRECTEUR)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Departement> creerDepartement(@Valid @RequestBody Departement departement) {
        Departement cree = departementService.creer(departement);
        return ResponseEntity.status(HttpStatus.CREATED).body(cree);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un département (DIRECTEUR)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Departement> mettreAJourDepartement(
            @PathVariable Long id,
            @Valid @RequestBody Departement departement) {
        return ResponseEntity.ok(departementService.mettreAJour(id, departement));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un département (DIRECTEUR)")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Void> supprimerDepartement(@PathVariable Long id) {
        departementService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
