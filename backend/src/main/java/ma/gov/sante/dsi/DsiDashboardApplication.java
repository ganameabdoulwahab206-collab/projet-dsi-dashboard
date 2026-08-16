package ma.gov.sante.dsi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée principal de l'application DSI Dashboard Backend.
 * <p>
 * Lance le serveur Spring Boot embarqué (Tomcat) sur le port 8080.
 * Toutes les routes sont préfixées par /api (cf. application.properties).
 * </p>
 *
 * @author Équipe DSI - Ministère de la Santé
 * @version 1.0.0
 */
@SpringBootApplication
public class DsiDashboardApplication {

    public static void main(String[] args) {
        SpringApplication.run(DsiDashboardApplication.class, args);
    }
}
