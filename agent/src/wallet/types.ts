// Ducket AI Galactica — Wallet Type Definitions
// Apache 2.0 License

export interface WalletConfig {
  seedPhrase: string;
  providerUrl: string;
  usdtContractAddress: string;
}

export interface TransferResult {
  hash: string;
  from: string;
  to: string;
  amount: string;
}
