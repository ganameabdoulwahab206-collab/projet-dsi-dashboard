package ma.gov.sante.dsi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import ma.gov.sante.dsi.model.Departement;
import ma.gov.sante.dsi.repository.DepartementRepository;
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

    private final DepartementRepository departementRepository;

    @GetMapping
    @Operation(summary = "Lister tous les départements")
    @PreAuthorize("hasAnyRole('DIRECTEUR', 'CHEF_SERVICE')")
    public ResponseEntity<List<Departement>> getAllDepartements() {
        return ResponseEntity.ok(departementRepository.findAll());
    }
}
