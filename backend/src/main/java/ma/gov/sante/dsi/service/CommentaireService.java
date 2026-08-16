package ma.gov.sante.dsi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.model.Commentaire;
import ma.gov.sante.dsi.model.Tache;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.repository.CommentaireRepository;
import ma.gov.sante.dsi.repository.TacheRepository;
import ma.gov.sante.dsi.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final TacheRepository tacheRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public List<Commentaire> findByTache(Long tacheId) {
        if (!tacheRepository.existsById(tacheId)) {
            throw new NoSuchElementException("Tâche introuvable avec l'id : " + tacheId);
        }
        return commentaireRepository.findByTacheIdOrderByDateCreationAsc(tacheId);
    }

    public Commentaire ajouterCommentaire(Long tacheId, Long utilisateurId, String contenu) {
        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new NoSuchElementException("Tâche introuvable avec l'id : " + tacheId));

        Utilisateur auteur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable avec l'id : " + utilisateurId));

        Commentaire commentaire = Commentaire.builder()
                .contenu(contenu)
                .auteur(auteur)
                .tache(tache)
                .build();

        return commentaireRepository.save(commentaire);
    }
}
