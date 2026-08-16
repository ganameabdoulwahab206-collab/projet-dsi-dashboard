package ma.gov.sante.dsi.security;

import lombok.RequiredArgsConstructor;
import ma.gov.sante.dsi.repository.UtilisateurRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémentation de {@link UserDetailsService} de Spring Security.
 * <p>
 * Spring Security appelle {@code loadUserByUsername} à deux moments :
 * <ol>
 *   <li>Lors du <strong>login</strong> via {@code AuthenticationManager.authenticate()}</li>
 *   <li>Lors de la <strong>validation JWT</strong> dans {@code JwtAuthenticationFilter}</li>
 * </ol>
 * Notre entité {@link ma.gov.sante.dsi.model.Utilisateur} implémente déjà
 * {@link UserDetails}, donc on la retourne directement sans mapping.
 * </p>
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    /**
     * Charge un utilisateur depuis la base de données par son email.
     * <p>
     * L'email joue le rôle de "username" dans Spring Security.
     * Si aucun utilisateur n'est trouvé, une exception est levée
     * et Spring Security retournera automatiquement un 401 Unauthorized.
     * </p>
     *
     * @param email l'email de l'utilisateur (passé comme "username")
     * @return l'objet UserDetails (notre entité Utilisateur)
     * @throws UsernameNotFoundException si aucun utilisateur avec cet email n'existe
     */
    @Override
    @Transactional(readOnly = true) // Lecture seule : optimisation de la transaction
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Aucun utilisateur trouvé avec l'email : " + email
                ));
    }
}
