package ma.gov.sante.dsi.repository;

import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository Spring Data JPA pour l'entité {@link Utilisateur}.
 * <p>
 * La méthode {@code findByEmail} est critique : elle est appelée par
 * {@code UserDetailsServiceImpl} lors de chaque validation de token JWT.
 * </p>
 */
@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    /**
     * Recherche un utilisateur par son adresse email.
     * <p>
     * Utilisée par Spring Security (UserDetailsService) pour charger
     * l'utilisateur lors de l'authentification et de la validation JWT.
     * </p>
     * SQL généré : SELECT * FROM utilisateurs WHERE email = ?
     *
     * @param email l'email de connexion de l'utilisateur
     * @return Optional de l'utilisateur (vide si aucun compte avec cet email)
     */
    Optional<Utilisateur> findByEmail(String email);

    /**
     * Vérifie si un email est déjà enregistré dans le système.
     * Utilisé avant la création d'un compte pour éviter les doublons.
     *
     * @param email l'email à vérifier
     * @return true si l'email existe déjà
     */
    boolean existsByEmail(String email);

    /**
     * Récupère tous les utilisateurs actifs appartenant à un département.
     * <p>
     * Utilisé pour afficher la liste des membres d'un service
     * dans le tableau de bord du Chef de Service.
     * </p>
     *
     * @param departementId l'identifiant du département
     * @return liste des utilisateurs actifs du département
     */
    List<Utilisateur> findByDepartementIdAndActifTrue(Long departementId);

    /**
     * Récupère tous les utilisateurs ayant un rôle spécifique.
     * Utile pour lister tous les agents ou tous les chefs de service.
     *
     * @param role le rôle à filtrer
     * @return liste des utilisateurs avec ce rôle
     */
    List<Utilisateur> findByRole(Role role);

    /**
     * Requête JPQL personnalisée : compte le nombre d'utilisateurs par département.
     * <p>
     * Utilisé dans le tableau de bord pour afficher la répartition des effectifs.
     * </p>
     *
     * @param departementId l'identifiant du département
     * @return le nombre d'utilisateurs dans ce département
     */
    @Query("SELECT COUNT(u) FROM Utilisateur u WHERE u.departement.id = :departementId AND u.actif = true")
    long compterUtilisateursActifsParDepartement(@Param("departementId") Long departementId);
}
