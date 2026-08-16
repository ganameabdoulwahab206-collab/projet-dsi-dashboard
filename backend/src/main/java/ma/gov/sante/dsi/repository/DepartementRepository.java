package ma.gov.sante.dsi.repository;

import ma.gov.sante.dsi.model.Departement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository Spring Data JPA pour l'entité {@link Departement}.
 * <p>
 * Spring Data génère automatiquement l'implémentation SQL à partir
 * des signatures de méthodes (Query Derivation).
 * </p>
 */
@Repository
public interface DepartementRepository extends JpaRepository<Departement, Long> {

    /**
     * Recherche un département par son nom exact.
     * <p>
     * Utilisé lors de la création d'un utilisateur pour vérifier
     * que le département renseigné existe bien.
     * </p>
     * SQL généré : SELECT * FROM departements WHERE nom = ?
     *
     * @param nom le nom du département (ex: "SERSI", "SEISAI")
     * @return Optional contenant le département s'il existe
     */
    Optional<Departement> findByNom(String nom);

    /**
     * Vérifie l'existence d'un département par son nom (sans charger l'entité).
     * Utile pour les validations avant création.
     *
     * @param nom le nom à vérifier
     * @return true si un département avec ce nom existe
     */
    boolean existsByNom(String nom);

    /**
     * Recherche un département dont le nom contient la chaîne donnée (insensible à la casse).
     * Utile pour une recherche/autocomplétion dans le frontend.
     *
     * @param nom fragment de nom à rechercher
     * @return Optional du département trouvé
     */
    Optional<Departement> findByNomContainingIgnoreCase(String nom);
}
