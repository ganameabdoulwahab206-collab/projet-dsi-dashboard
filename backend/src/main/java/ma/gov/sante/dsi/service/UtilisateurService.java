package ma.gov.sante.dsi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.model.Departement;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.model.enums.Role;
import ma.gov.sante.dsi.repository.DepartementRepository;
import ma.gov.sante.dsi.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final DepartementRepository departementRepository;

    @Transactional(readOnly = true)
    public List<Utilisateur> findAll() {
        return utilisateurRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Utilisateur> findByDepartementId(Long departementId) {
        log.info("Récupération des utilisateurs actifs pour le département : {}", departementId);
        return utilisateurRepository.findByDepartementIdAndActifTrue(departementId);
    }

    public Utilisateur changerDepartement(Long utilisateurId, Long departementId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable : " + utilisateurId));
        Departement departement = departementRepository.findById(departementId)
                .orElseThrow(() -> new NoSuchElementException("Département introuvable : " + departementId));
        utilisateur.setDepartement(departement);
        log.info("Utilisateur {} affecté au département {}", utilisateur.getEmail(), departement.getNom());
        return utilisateurRepository.save(utilisateur);
    }

    public Utilisateur changerRole(Long utilisateurId, Role role) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable : " + utilisateurId));
        utilisateur.setRole(role);
        log.info("Rôle de {} changé en {}", utilisateur.getEmail(), role);
        return utilisateurRepository.save(utilisateur);
    }

    public Utilisateur toggleActif(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable : " + utilisateurId));
        utilisateur.setActif(!utilisateur.isActif());
        log.info("Compte {} : actif={}", utilisateur.getEmail(), utilisateur.isActif());
        return utilisateurRepository.save(utilisateur);
    }
}
