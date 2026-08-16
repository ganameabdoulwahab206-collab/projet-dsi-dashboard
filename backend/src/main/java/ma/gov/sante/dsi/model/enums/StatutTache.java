package ma.gov.sante.dsi.model.enums;

/**
 * Statuts possibles pour une tâche.
 */
public enum StatutTache {

    /** Tâche créée mais non commencée */
    A_FAIRE,

    /** Tâche en cours de réalisation */
    EN_COURS,

    /** Tâche en attente de validation ou de ressources */
    EN_ATTENTE,

    /** Tâche complétée et validée */
    TERMINEE,

    /** Tâche bloquée par un problème externe */
    BLOQUEE
}
