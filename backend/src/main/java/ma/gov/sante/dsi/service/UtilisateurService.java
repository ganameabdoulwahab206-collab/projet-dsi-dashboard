package ma.gov.sante.dsi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.model.Departement;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.model.enums.Role;
import ma.gov.sante.dsi.repository.DepartementRepository;
import ma.gov.sante.dsi.repository.UtilisateurRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;

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

    /**
     * Met à jour le nom de l'utilisateur connecté (auto-modification du profil).
     */
    public Utilisateur updateProfil(Long utilisateurId, String nouveauNom) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable : " + utilisateurId));
        if (nouveauNom != null && !nouveauNom.isBlank()) {
            utilisateur.setNom(nouveauNom.trim());
        }
        log.info("Profil mis à jour pour : {}", utilisateur.getEmail());
        return utilisateurRepository.save(utilisateur);
    }

    /**
     * Change le mot de passe de l'utilisateur connecté après vérification de l'ancien.
     */
    public void changerMotDePasse(Long utilisateurId, String ancienMdp, String nouveauMdp) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable : " + utilisateurId));
        if (!passwordEncoder.matches(ancienMdp, utilisateur.getMotDePasse())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect.");
        }
        utilisateur.setMotDePasse(passwordEncoder.encode(nouveauMdp));
        log.info("Mot de passe changé pour : {}", utilisateur.getEmail());
        utilisateurRepository.save(utilisateur);
    }

    /**
     * Crée un nouvel utilisateur (DIRECTEUR).
     */
    public Utilisateur creer(Utilisateur utilisateur, Long departementId, String motDePasseClair) {
        if (utilisateurRepository.existsByEmail(utilisateur.getEmail())) {
            throw new IllegalArgumentException("Un utilisateur avec l'email " + utilisateur.getEmail() + " existe déjà.");
        }
        if (departementId != null) {
            Departement dept = departementRepository.findById(departementId)
                    .orElseThrow(() -> new NoSuchElementException("Département introuvable : " + departementId));
            utilisateur.setDepartement(dept);
        }
        utilisateur.setMotDePasse(passwordEncoder.encode(motDePasseClair));
        utilisateur.setActif(true);
        log.info("Création utilisateur : {}", utilisateur.getEmail());
        return utilisateurRepository.save(utilisateur);
    }

    /**
     * Supprime définitivement un utilisateur (DIRECTEUR).
     */
    public void supprimer(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable : " + utilisateurId));
        log.info("Suppression utilisateur : {}", utilisateur.getEmail());
        utilisateurRepository.delete(utilisateur);
    }
}
