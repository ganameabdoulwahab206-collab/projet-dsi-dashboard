package ma.gov.sante.dsi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.exception.ResourceNotFoundException;
import ma.gov.sante.dsi.model.Departement;
import ma.gov.sante.dsi.repository.DepartementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DepartementService {

    private final DepartementRepository departementRepository;

    @Transactional(readOnly = true)
    public List<Departement> findAll() {
        return departementRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Departement findById(Long id) {
        return departementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Département", "id", id));
    }

    public Departement creer(Departement departement) {
        if (departementRepository.existsByNom(departement.getNom())) {
            throw new IllegalArgumentException("Un département avec le nom '" + departement.getNom() + "' existe déjà.");
        }
        log.info("Création du département : {}", departement.getNom());
        return departementRepository.save(departement);
    }

    public Departement mettreAJour(Long id, Departement details) {
        Departement departement = findById(id);
        if (!departement.getNom().equalsIgnoreCase(details.getNom()) && departementRepository.existsByNom(details.getNom())) {
            throw new IllegalArgumentException("Un autre département porte déjà ce nom : " + details.getNom());
        }
        departement.setNom(details.getNom());
        departement.setDescription(details.getDescription());
        log.info("Mise à jour du département ID {} : {}", id, details.getNom());
        return departementRepository.save(departement);
    }

    public void supprimer(Long id) {
        Departement departement = findById(id);
        log.info("Suppression du département ID {} : {}", id, departement.getNom());
        departementRepository.delete(departement);
    }
}
