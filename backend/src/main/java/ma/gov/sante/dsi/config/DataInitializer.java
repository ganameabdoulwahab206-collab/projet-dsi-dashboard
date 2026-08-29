package ma.gov.sante.dsi.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.gov.sante.dsi.model.Departement;
import ma.gov.sante.dsi.model.Projet;
import ma.gov.sante.dsi.model.Tache;
import ma.gov.sante.dsi.model.Utilisateur;
import ma.gov.sante.dsi.model.enums.Role;
import ma.gov.sante.dsi.model.enums.StatutProjet;
import ma.gov.sante.dsi.model.enums.StatutTache;
import ma.gov.sante.dsi.repository.DepartementRepository;
import ma.gov.sante.dsi.repository.ProjetRepository;
import ma.gov.sante.dsi.repository.TacheRepository;
import ma.gov.sante.dsi.repository.UtilisateurRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

/**
 * Initialiseur automatique de données de démonstration au démarrage.
 * Ne s'exécute que si la base de données est vide.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final DepartementRepository departementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (departementRepository.count() > 0) {
            log.info("Données déjà présentes en base. Initialisation ignorée.");
            return;
        }

        log.info("Base de données vide détectée. Initialisation des données DSI...");

        // 1. Création des départements
        Departement sersi = departementRepository.save(Departement.builder()
                .nom("SERSI")
                .description("Service des Réseaux, Systèmes et Infrastructures Informatiques")
                .build());

        Departement seisai = departementRepository.save(Departement.builder()
                .nom("SEISAI")
                .description("Service des Études, Ingénierie et Solutions Applicatives")
                .build());

        Departement spcp = departementRepository.save(Departement.builder()
                .nom("SPCP")
                .description("Service Pilotage, Coordination et Conduite de Projets")
                .build());

        // 2. Création des utilisateurs
        Utilisateur directeur = utilisateurRepository.save(Utilisateur.builder()
                .nom("Dr. Amina Bennani")
                .email("directeur@sante.gov.ma")
                .motDePasse(passwordEncoder.encode("Directeur123!"))
                .role(Role.DIRECTEUR)
                .actif(true)
                .departement(spcp)
                .build());

        Utilisateur chefSersi = utilisateurRepository.save(Utilisateur.builder()
                .nom("Youssef Mansouri")
                .email("chef.sersi@sante.gov.ma")
                .motDePasse(passwordEncoder.encode("Chef123!"))
                .role(Role.CHEF_SERVICE)
                .actif(true)
                .departement(sersi)
                .build());

        Utilisateur chefSeisai = utilisateurRepository.save(Utilisateur.builder()
                .nom("Fatima Zahra El Amrani")
                .email("chef.seisai@sante.gov.ma")
                .motDePasse(passwordEncoder.encode("Chef123!"))
                .role(Role.CHEF_SERVICE)
                .actif(true)
                .departement(seisai)
                .build());

        Utilisateur agent1 = utilisateurRepository.save(Utilisateur.builder()
                .nom("Mehdi Touhami")
                .email("agent.sersi@sante.gov.ma")
                .motDePasse(passwordEncoder.encode("Agent123!"))
                .role(Role.AGENT)
                .actif(true)
                .departement(sersi)
                .build());

        Utilisateur agent2 = utilisateurRepository.save(Utilisateur.builder()
                .nom("Salma Idrissi")
                .email("agent.seisai@sante.gov.ma")
                .motDePasse(passwordEncoder.encode("Agent123!"))
                .role(Role.AGENT)
                .actif(true)
                .departement(seisai)
                .build());

        // 3. Création des projets
        Projet p1 = projetRepository.save(Projet.builder()
                .titre("Migration vers le Cloud Hospitalier")
                .description("Modernisation de l'infrastructure serveurs et migration des données de santé vers un cloud sécurisé.")
                .statut(StatutProjet.EN_COURS)
                .avancement(50)
                .dateDebut(LocalDate.now().minusMonths(2))
                .dateFin(LocalDate.now().plusMonths(3))
                .departement(sersi)
                .build());

        Projet p2 = projetRepository.save(Projet.builder()
                .titre("Portail Numérique Patient & Prise de RDV")
                .description("Développement de la plateforme nationale de prise de rendez-vous en ligne dans les centres hospitaliers.")
                .statut(StatutProjet.EN_COURS)
                .avancement(33)
                .dateDebut(LocalDate.now().minusMonths(1))
                .dateFin(LocalDate.now().plusMonths(4))
                .departement(seisai)
                .build());

        Projet p3 = projetRepository.save(Projet.builder()
                .titre("Renouvellement du Réseau Télécoms des CHU")
                .description("Déploiement de la fibre optique dédiée et sécurisation des accès réseau inter-hôpitaux.")
                .statut(StatutProjet.TERMINE)
                .avancement(100)
                .dateDebut(LocalDate.now().minusMonths(6))
                .dateFin(LocalDate.now().minusMonths(1))
                .departement(sersi)
                .build());

        // 4. Création des tâches
        tacheRepository.save(Tache.builder()
                .description("Audit d'architecture des serveurs existants")
                .statut(StatutTache.TERMINEE)
                .priorite(3)
                .dateEcheance(LocalDate.now().minusWeeks(2))
                .projet(p1)
                .utilisateur(agent1)
                .build());

        tacheRepository.save(Tache.builder()
                .description("Configuration du VPN inter-hôpitaux et firewall")
                .statut(StatutTache.EN_COURS)
                .priorite(4)
                .dateEcheance(LocalDate.now().plusWeeks(2))
                .projet(p1)
                .utilisateur(agent1)
                .build());

        tacheRepository.save(Tache.builder()
                .description("Développement du module d'authentification patient")
                .statut(StatutTache.TERMINEE)
                .priorite(3)
                .dateEcheance(LocalDate.now().minusWeeks(1))
                .projet(p2)
                .utilisateur(agent2)
                .build());

        tacheRepository.save(Tache.builder()
                .description("Intégration de l'API de notification SMS de rappel")
                .statut(StatutTache.EN_COURS)
                .priorite(2)
                .dateEcheance(LocalDate.now().plusWeeks(3))
                .projet(p2)
                .utilisateur(agent2)
                .build());

        tacheRepository.save(Tache.builder()
                .description("Tests de charge et validation sécurité RGPD")
                .statut(StatutTache.A_FAIRE)
                .priorite(4)
                .dateEcheance(LocalDate.now().plusMonths(1))
                .projet(p2)
                .utilisateur(agent2)
                .build());

        log.info("Initialisation terminée avec succès : 3 départements, 5 utilisateurs, 3 projets et 5 tâches créés.");
    }
}
