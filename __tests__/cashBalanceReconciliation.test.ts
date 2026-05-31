import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock assetService before importing the module under test
const mockUpdateCashAssetBalance = vi.fn();
vi.mock('@/lib/services/assetService', () => ({
  updateCashAssetBalance: (...args: unknown[]) => mockUpdateCashAssetBalance(...args),
}));

import {
  reconcileTransferEdit,
  reconcileTransferCreate,
  reconcileSingleEdit,
  reconcileSingleCreate,
  reconcileTransferDelete,
} from '@/lib/services/cashBalanceReconciliation';

describe('cashBalanceReconciliation', () => {
  beforeEach(() => {
    mockUpdateCashAssetBalance.mockReset();
    mockUpdateCashAssetBalance.mockResolvedValue(undefined);
  });

  // ─── reconcileTransferEdit ─────────────────────────────────────────────────

  describe('reconcileTransferEdit', () => {
    it('should reverse old balances and apply new balances in correct order', async () => {
      const result = await reconcileTransferEdit({
        oldOriginId: 'oldOrigin',
        oldDestId: 'oldDest',
        newOriginId: 'newOrigin',
        newDestId: 'newDest',
        oldAmount: 100,
        newAmount: 200,
      });

      expect(result).toBe(true);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(4);
      // Step 1: Reverse old origin debit (add back 100)
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(1, 'oldOrigin', 100);
      // Step 2: Reverse old destination credit (remove 100)
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(2, 'oldDest', -100);
      // Step 3: Apply new origin debit (subtract 200)
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(3, 'newOrigin', -200);
      // Step 4: Apply new destination credit (add 200)
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(4, 'newDest', 200);
    });

    it('should skip steps for missing asset IDs', async () => {
      const result = await reconcileTransferEdit({
        oldOriginId: undefined,
        oldDestId: 'oldDest',
        newOriginId: 'newOrigin',
        newDestId: undefined,
        oldAmount: 50,
        newAmount: 75,
      });

      expect(result).toBe(true);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(2);
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(1, 'oldDest', -50);
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(2, 'newOrigin', -75);
    });

    it('should return false when no asset IDs are provided', async () => {
      const result = await reconcileTransferEdit({
        oldOriginId: undefined,
        oldDestId: undefined,
        newOriginId: undefined,
        newDestId: undefined,
        oldAmount: 100,
        newAmount: 200,
      });

      expect(result).toBe(false);
      expect(mockUpdateCashAssetBalance).not.toHaveBeenCalled();
    });

    it('should throw with descriptive error if step fails mid-way', async () => {
      mockUpdateCashAssetBalance
        .mockResolvedValueOnce(undefined) // Step 1 succeeds
        .mockResolvedValueOnce(undefined) // Step 2 succeeds
        .mockRejectedValueOnce(new Error('Firestore write failed')); // Step 3 fails

      await expect(
        reconcileTransferEdit({
          oldOriginId: 'origin',
          oldDestId: 'dest',
          newOriginId: 'newOrigin',
          newDestId: 'newDest',
          oldAmount: 100,
          newAmount: 200,
        })
      ).rejects.toThrow('Riconciliazione trasferimento fallita dopo 2/4 passaggi');
    });
  });

  // ─── reconcileSingleEdit ───────────────────────────────────────────────────

  describe('reconcileSingleEdit', () => {
    it('should compute delta when linked asset stays the same', async () => {
      const result = await reconcileSingleEdit({
        oldLinkedAssetId: 'assetA',
        newLinkedAssetId: 'assetA',
        oldSignedAmount: -100,
        newSignedAmount: -150,
      });

      expect(result).toBe(true);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(1);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledWith('assetA', -50);
    });

    it('should skip update when delta is negligible (same asset)', async () => {
      const result = await reconcileSingleEdit({
        oldLinkedAssetId: 'assetA',
        newLinkedAssetId: 'assetA',
        oldSignedAmount: -100,
        newSignedAmount: -100,
      });

      expect(result).toBe(false);
      expect(mockUpdateCashAssetBalance).not.toHaveBeenCalled();
    });

    it('should reverse old and apply new when linked asset changes', async () => {
      const result = await reconcileSingleEdit({
        oldLinkedAssetId: 'assetA',
        newLinkedAssetId: 'assetB',
        oldSignedAmount: -100,
        newSignedAmount: -200,
      });

      expect(result).toBe(true);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(2);
      // Reverse old: remove the -100 effect → +100
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(1, 'assetA', 100);
      // Apply new: -200
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(2, 'assetB', -200);
    });

    it('should handle only old asset being unlinked', async () => {
      const result = await reconcileSingleEdit({
        oldLinkedAssetId: 'assetA',
        newLinkedAssetId: undefined,
        oldSignedAmount: -100,
        newSignedAmount: -100,
      });

      expect(result).toBe(true);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(1);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledWith('assetA', 100);
    });

    it('should handle newly linked asset (no old linked)', async () => {
      const result = await reconcileSingleEdit({
        oldLinkedAssetId: undefined,
        newLinkedAssetId: 'assetB',
        oldSignedAmount: -100,
        newSignedAmount: -150,
      });

      expect(result).toBe(true);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(1);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledWith('assetB', -150);
    });
  });

  // ─── reconcileTransferCreate ───────────────────────────────────────────────

  describe('reconcileTransferCreate', () => {
    it('should debit origin and credit destination', async () => {
      const result = await reconcileTransferCreate({
        originId: 'origin',
        destId: 'dest',
        amount: 500,
      });

      expect(result).toBe(true);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(2);
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(1, 'origin', -500);
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(2, 'dest', 500);
    });

    it('should handle missing destination', async () => {
      const result = await reconcileTransferCreate({
        originId: 'origin',
        destId: undefined,
        amount: 300,
      });

      expect(result).toBe(true);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(1);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledWith('origin', -300);
    });

    it('should throw on failure', async () => {
      mockUpdateCashAssetBalance.mockRejectedValueOnce(new Error('write failed'));

      await expect(
        reconcileTransferCreate({ originId: 'origin', destId: 'dest', amount: 100 })
      ).rejects.toThrow('Riconciliazione saldi trasferimento fallita');
    });
  });

  // ─── reconcileSingleCreate ─────────────────────────────────────────────────

  describe('reconcileSingleCreate', () => {
    it('should apply signed amount to linked asset', async () => {
      await reconcileSingleCreate({ linkedAssetId: 'cash1', signedAmount: -250 });

      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(1);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledWith('cash1', -250);
    });

    it('should propagate errors', async () => {
      mockUpdateCashAssetBalance.mockRejectedValueOnce(new Error('fail'));

      await expect(
        reconcileSingleCreate({ linkedAssetId: 'cash1', signedAmount: -100 })
      ).rejects.toThrow('fail');
    });
  });

  // ─── reconcileTransferDelete ───────────────────────────────────────────────

  describe('reconcileTransferDelete', () => {
    it('should reverse origin debit and destination credit', async () => {
      const result = await reconcileTransferDelete({
        originId: 'origin',
        destId: 'dest',
        amount: 400,
      });

      expect(result).toBe(true);
      expect(mockUpdateCashAssetBalance).toHaveBeenCalledTimes(2);
      // Reverse debit (add back)
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(1, 'origin', 400);
      // Reverse credit (remove)
      expect(mockUpdateCashAssetBalance).toHaveBeenNthCalledWith(2, 'dest', -400);
    });

    it('should return false when no asset IDs present', async () => {
      const result = await reconcileTransferDelete({
        originId: undefined,
        destId: undefined,
        amount: 100,
      });

      expect(result).toBe(false);
      expect(mockUpdateCashAssetBalance).not.toHaveBeenCalled();
    });

    it('should throw on failure', async () => {
      mockUpdateCashAssetBalance.mockRejectedValueOnce(new Error('write failed'));

      await expect(
        reconcileTransferDelete({ originId: 'origin', destId: 'dest', amount: 100 })
      ).rejects.toThrow('Riconciliazione saldi trasferimento fallita');
    });
  });
});
