/**
 * Statut de validation d'un produit
 */
export enum ProductStatus {
  /** Brouillon - Produit en cours de création */
  DRAFT = 'draft',
  
  /** En attente - Produit soumis pour validation */
  PENDING = 'pending',
  
  /** Approuvé - Produit validé par un admin */
  APPROVED = 'approved',
  
  /** Rejeté - Produit refusé par un admin */
  REJECTED = 'rejected',
}

/**
 * Type d'activité sur un produit
 */
export enum ProductActivityType {
  /** Création du produit */
  CREATE = 'create',
  
  /** Modification du produit */
  UPDATE = 'update',
  
  /** Soumission pour validation */
  SUBMIT = 'submit',
  
  /** Approbation par admin */
  APPROVE = 'approve',
  
  /** Rejet par admin */
  REJECT = 'reject',
}

