package ma.gov.sante.dsi.repository;

import ma.gov.sante.dsi.model.Commentaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour la gestion des commentaires.
 */
@Repository
public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {

    /**
     * Récupère tous les commentaires d'une tâche spécifique, triés par date de création.
     *
     * @param tacheId l'identifiant de la tâche
     * @return liste des commentaires de la tâche
     */
    List<Commentaire> findByTacheIdOrderByDateCreationAsc(Long tacheId);
}
