import apiClient from './client';

export interface FundByAccountDto {
  accountNumber: string;
  amount: number;
}

export interface FundByAccountResult {
  userId: string;
  reference: string;
  amountNaira: number;
  transactionId: string;
}

/**
 * Wraps the backend `POST /wallet/test/fund-by-account` endpoint.
 * Non-production + admin-only on the server; the backend returns 403
 * when `NODE_ENV=production`. Used by the admin "Fund by Account
 * (Test)" page to rehearse the Paystack DVA credit flow without
 * Paystack in the loop.
 */
export const walletTestApi = {
  fundByAccount: async (
    dto: FundByAccountDto,
  ): Promise<FundByAccountResult> => {
    const response = await apiClient.post<FundByAccountResult>(
      '/wallet/test/fund-by-account',
      dto,
    );
    return response.data;
  },
};
