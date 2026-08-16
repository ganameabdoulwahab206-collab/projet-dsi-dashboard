package ma.gov.sante.dsi.model.enums;

/**
 * Énumération des rôles disponibles dans l'application DSI Dashboard.
 * Chaque rôle détermine le niveau d'accès et les fonctionnalités disponibles.
 */
public enum Role {

    /**
     * Directeur : Vision globale, accès complet au tableau de bord, export PDF.
     */
    DIRECTEUR,

    /**
     * Chef de Service : Validation des rapports de son service, paramétrage des KPI.
     * Sous-rôles implicites : SERSI, SEISAI, SPCP (géré via le département).
     */
    CHEF_SERVICE,

    /**
     * Agent / Technicien : Saisie des activités hebdomadaires et des tâches.
     */
    AGENT
}
