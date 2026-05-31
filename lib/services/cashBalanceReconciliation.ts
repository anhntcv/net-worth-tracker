/**
 * Cash Balance Reconciliation Service
 *
 * Handles cash asset balance updates when expenses are created, edited, or deleted.
 * Extracted from UI components to keep business logic testable and maintainable.
 *
 * Transfer reconciliation involves 4 sequential balance updates (reverse old pair,
 * apply new pair). If any step fails, a detailed error is logged with which step
 * failed and the partial state, so the user can manually correct the balances.
 */

import { updateCashAssetBalance } from '@/lib/services/assetService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransferReconcileParams {
  oldOriginId?: string;
  oldDestId?: string;
  newOriginId?: string;
  newDestId?: string;
  oldAmount: number;
  newAmount: number;
}

export interface SingleReconcileEditParams {
  oldLinkedAssetId?: string;
  newLinkedAssetId?: string;
  oldSignedAmount: number;
  newSignedAmount: number;
}

export interface TransferCreateParams {
  originId?: string;
  destId?: string;
  amount: number;
}

export interface SingleCreateParams {
  linkedAssetId: string;
  signedAmount: number;
}

export interface TransferDeleteParams {
  originId?: string;
  destId?: string;
  amount: number;
}

export interface SingleDeleteParams {
  linkedAssetId: string;
  signedAmount: number;
}

// ─── Reconciliation Functions ─────────────────────────────────────────────────

/**
 * Reconcile cash balances when editing a transfer.
 * 4-step process: reverse old origin, reverse old destination, apply new origin, apply new destination.
 * Returns true if any asset was updated.
 *
 * Throws with a descriptive message if any step fails, logging which step
 * succeeded and which failed so the user can manually correct balances.
 */
export async function reconcileTransferEdit(params: TransferReconcileParams): Promise<boolean> {
  const { oldOriginId, oldDestId, newOriginId, newDestId, oldAmount, newAmount } = params;
  let assetUpdated = false;
  const completedSteps: string[] = [];

  try {
    // Step 1: Reverse old origin debit
    if (oldOriginId) {
      await updateCashAssetBalance(oldOriginId, oldAmount);
      completedSteps.push(`reversed origin debit (${oldOriginId}: +${oldAmount})`);
      assetUpdated = true;
    }

    // Step 2: Reverse old destination credit
    if (oldDestId) {
      await updateCashAssetBalance(oldDestId, -oldAmount);
      completedSteps.push(`reversed dest credit (${oldDestId}: -${oldAmount})`);
      assetUpdated = true;
    }

    // Step 3: Apply new origin debit
    if (newOriginId) {
      await updateCashAssetBalance(newOriginId, -newAmount);
      completedSteps.push(`applied origin debit (${newOriginId}: -${newAmount})`);
      assetUpdated = true;
    }

    // Step 4: Apply new destination credit
    if (newDestId) {
      await updateCashAssetBalance(newDestId, newAmount);
      completedSteps.push(`applied dest credit (${newDestId}: +${newAmount})`);
      assetUpdated = true;
    }
  } catch (error) {
    console.error('Transfer reconciliation failed mid-way', {
      completedSteps,
      params,
      error,
    });
    throw new Error(
      `Riconciliazione trasferimento fallita dopo ${completedSteps.length}/4 passaggi. ` +
      'Verifica i saldi dei conti manualmente.'
    );
  }

  return assetUpdated;
}

/**
 * Reconcile cash balance when editing a non-transfer expense.
 * Handles same-asset delta optimization and cross-asset swaps.
 * Returns true if any asset was updated.
 */
export async function reconcileSingleEdit(params: SingleReconcileEditParams): Promise<boolean> {
  const { oldLinkedAssetId, newLinkedAssetId, oldSignedAmount, newSignedAmount } = params;

  if (oldLinkedAssetId && newLinkedAssetId && oldLinkedAssetId === newLinkedAssetId) {
    const delta = newSignedAmount - oldSignedAmount;
    if (Math.abs(delta) > 0.001) {
      await updateCashAssetBalance(oldLinkedAssetId, delta);
      return true;
    }
    return false;
  }

  let updated = false;
  if (oldLinkedAssetId) {
    await updateCashAssetBalance(oldLinkedAssetId, -oldSignedAmount);
    updated = true;
  }
  if (newLinkedAssetId) {
    await updateCashAssetBalance(newLinkedAssetId, newSignedAmount);
    updated = true;
  }
  return updated;
}

/**
 * Apply cash balance changes when creating a transfer.
 * Returns true if any asset was updated.
 */
export async function reconcileTransferCreate(params: TransferCreateParams): Promise<boolean> {
  const { originId, destId, amount } = params;
  let updated = false;

  try {
    if (originId) {
      await updateCashAssetBalance(originId, -amount);
      updated = true;
    }
    if (destId) {
      await updateCashAssetBalance(destId, amount);
      updated = true;
    }
  } catch (error) {
    console.error('Transfer create reconciliation failed', {
      originId,
      destId,
      amount,
      error,
    });
    throw new Error(
      'Riconciliazione saldi trasferimento fallita. Verifica i saldi dei conti manualmente.'
    );
  }

  return updated;
}

/**
 * Apply cash balance changes when creating a single (non-transfer) expense.
 */
export async function reconcileSingleCreate(params: SingleCreateParams): Promise<void> {
  await updateCashAssetBalance(params.linkedAssetId, params.signedAmount);
}

/**
 * Reverse cash balance changes when deleting a transfer.
 * Returns true if any asset was updated.
 */
export async function reconcileTransferDelete(params: TransferDeleteParams): Promise<boolean> {
  const { originId, destId, amount } = params;
  let updated = false;

  try {
    // Reverse the debit on origin (add back)
    if (originId) {
      await updateCashAssetBalance(originId, amount);
      updated = true;
    }
    // Reverse the credit on destination (remove)
    if (destId) {
      await updateCashAssetBalance(destId, -amount);
      updated = true;
    }
  } catch (error) {
    console.error('Transfer delete reconciliation failed', {
      originId,
      destId,
      amount,
      error,
    });
    throw new Error(
      'Riconciliazione saldi trasferimento fallita. Verifica i saldi dei conti manualmente.'
    );
  }

  return updated;
}
