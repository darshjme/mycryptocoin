import { Request, Response } from 'express';
import { walletService } from '../services/wallet.service';
import { withdrawalService } from '../services/withdrawal.service';
import { CryptoSymbol } from '../config/crypto';
import { asyncHandler } from '../middleware/errorHandler';
import { parsePagination, buildPaginatedResult } from '../utils/helpers';

export const getWallets = asyncHandler(async (req: Request, res: Response) => {
  const wallets = await walletService.getMerchantWallets(req.merchant!.id);

  res.status(200).json({
    success: true,
    data: wallets.map((w) => ({
      crypto: w.crypto,
      address: w.address,
      balance: w.balance.toString(),
      pendingBalance: w.pendingBalance.toString(),
      liveBalance: w.liveBalance,
      totalReceived: w.totalReceived.toString(),
      totalWithdrawn: w.totalWithdrawn.toString(),
      autoWithdrawEnabled: w.autoWithdrawEnabled,
      autoWithdrawThreshold: w.autoWithdrawThreshold?.toString(),
    })),
  });
});

export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const crypto = req.params.crypto as CryptoSymbol;
  const wallet = await walletService.getWallet(req.merchant!.id, crypto);

  res.status(200).json({
    success: true,
    data: {
      crypto: wallet.crypto,
      address: wallet.address,
      balance: wallet.balance.toString(),
      pendingBalance: wallet.pendingBalance.toString(),
      liveBalance: wallet.liveBalance,
      totalReceived: wallet.totalReceived.toString(),
      totalWithdrawn: wallet.totalWithdrawn.toString(),
      autoWithdrawEnabled: wallet.autoWithdrawEnabled,
      autoWithdrawAddress: wallet.autoWithdrawAddress,
      autoWithdrawThreshold: wallet.autoWithdrawThreshold?.toString(),
    },
  });
});

export const configureAutoWithdraw = asyncHandler(
  async (req: Request, res: Response) => {
    const crypto = req.params.crypto as CryptoSymbol;
    const wallet = await walletService.configureAutoWithdraw(
      req.merchant!.id,
      crypto,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: {
        crypto: wallet.crypto,
        autoWithdrawEnabled: wallet.autoWithdrawEnabled,
        autoWithdrawAddress: wallet.autoWithdrawAddress,
        autoWithdrawThreshold: wallet.autoWithdrawThreshold?.toString(),
      },
      message: `Auto-withdraw ${wallet.autoWithdrawEnabled ? 'enabled' : 'disabled'} for ${crypto}`,
    });
  },
);

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  const crypto = req.params.crypto as CryptoSymbol;
  const withdrawal = await withdrawalService.requestWithdrawal(
    req.merchant!.id,
    crypto,
    req.body,
  );

  res.status(201).json({
    success: true,
    data: {
      id: withdrawal.id,
      crypto: withdrawal.crypto,
      amount: withdrawal.amount.toString(),
      toAddress: withdrawal.toAddress,
      estimatedFee: withdrawal.estimatedFee.toString(),
      status: withdrawal.status,
      createdAt: withdrawal.createdAt,
    },
    message: 'Withdrawal queued for processing',
  });
});
