package ma.gov.sante.dsi.model.enums;

/**
 * Statuts possibles pour un projet DSI.
 */
public enum StatutProjet {

    /** Projet planifié mais pas encore démarré */
    EN_ATTENTE,

    /** Projet actuellement en cours d'exécution */
    EN_COURS,

    /** Projet temporairement suspendu */
    SUSPENDU,

    /** Projet terminé avec succès */
    TERMINE,

    /** Projet annulé */
    ANNULE
}
