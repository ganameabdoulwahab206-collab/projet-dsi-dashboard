package ma.gov.sante.dsi.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entité représentant un commentaire sur une tâche.
 */
@Entity
@Table(name = "commentaires", indexes = {
        @Index(name = "idx_commentaire_tache", columnList = "tache_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Commentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le contenu du commentaire ne peut pas être vide")
    @Column(name = "contenu", nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(name = "date_creation", nullable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false, foreignKey = @ForeignKey(name = "fk_commentaire_utilisateur"))
    @JsonIgnoreProperties({"taches", "motDePasse", "departement", "authorities"})
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tache_id", nullable = false, foreignKey = @ForeignKey(name = "fk_commentaire_tache"))
    @JsonIgnoreProperties({"commentaires", "projet", "utilisateur"})
    private Tache tache;
}
