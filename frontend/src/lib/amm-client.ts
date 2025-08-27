import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getMint,
} from '@solana/spl-token';

// Our deployed AMM program ID
export const AMM_PROGRAM_ID = new PublicKey('pDPr3yM12LyCwU9kN8DqgqF1C56Gf9VH5xU4dE4f8Bs');

// Seeds for PDA derivation
const POOL_SEED = Buffer.from('pool');
const LP_TOKEN_SEED = Buffer.from('lp_token');
const AUTHORITY_SEED = Buffer.from('authority');

// Instruction discriminators
enum AmmInstruction {
  InitializePool = 0,
  AddLiquidity = 1,
  RemoveLiquidity = 2,
  Swap = 3,
}

export interface PoolInfo {
  address: PublicKey;
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  lpTokenMint: PublicKey;
  authority: PublicKey;
  tokenAReserve: number;
  tokenBReserve: number;
  lpTokenSupply: number;
  feeRate: number;
}

export interface TokenInfo {
  mint: PublicKey;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export class AmmClient {
  constructor(private connection: Connection) {}

  /**
   * Derive pool PDA
   */
  getPoolAddress(tokenAMint: PublicKey, tokenBMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [POOL_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      AMM_PROGRAM_ID
    );
  }

  /**
   * Derive LP token mint PDA
   */
  getLpTokenMintAddress(tokenAMint: PublicKey, tokenBMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [LP_TOKEN_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      AMM_PROGRAM_ID
    );
  }

  /**
   * Derive pool authority PDA
   */
  getPoolAuthorityAddress(tokenAMint: PublicKey, tokenBMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [AUTHORITY_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      AMM_PROGRAM_ID
    );
  }

  /**
   * Create initialize pool instruction
   */
  async createInitializePoolInstruction(
    initializer: PublicKey,
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    feeRate: number = 30 // 0.3%
  ): Promise<TransactionInstruction> {
    const [poolAddress] = this.getPoolAddress(tokenAMint, tokenBMint);
    const [lpTokenMint] = this.getLpTokenMintAddress(tokenAMint, tokenBMint);
    const [poolAuthority] = this.getPoolAuthorityAddress(tokenAMint, tokenBMint);

    const poolTokenA = await getAssociatedTokenAddress(tokenAMint, poolAuthority, true);
    const poolTokenB = await getAssociatedTokenAddress(tokenBMint, poolAuthority, true);

    // Create instruction data
    const instructionData = Buffer.alloc(3);
    instructionData.writeUInt8(AmmInstruction.InitializePool, 0);
    instructionData.writeUInt16LE(feeRate, 1);

    return new TransactionInstruction({
      keys: [
        { pubkey: initializer, isSigner: true, isWritable: true },
        { pubkey: poolAddress, isSigner: false, isWritable: true },
        { pubkey: tokenAMint, isSigner: false, isWritable: false },
        { pubkey: tokenBMint, isSigner: false, isWritable: false },
        { pubkey: lpTokenMint, isSigner: false, isWritable: true },
        { pubkey: poolTokenA, isSigner: false, isWritable: true },
        { pubkey: poolTokenB, isSigner: false, isWritable: true },
        { pubkey: poolAuthority, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId: AMM_PROGRAM_ID,
      data: instructionData,
    });
  }

  /**
   * Create swap instruction
   */
  async createSwapInstruction(
    user: PublicKey,
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    amountIn: number,
    minimumAmountOut: number,
    aToB: boolean
  ): Promise<TransactionInstruction> {
    const [poolAddress] = this.getPoolAddress(tokenAMint, tokenBMint);
    const [poolAuthority] = this.getPoolAuthorityAddress(tokenAMint, tokenBMint);

    const inputMint = aToB ? tokenAMint : tokenBMint;
    const outputMint = aToB ? tokenBMint : tokenAMint;

    const userInputToken = await getAssociatedTokenAddress(inputMint, user);
    const userOutputToken = await getAssociatedTokenAddress(outputMint, user);
    const poolInputToken = await getAssociatedTokenAddress(inputMint, poolAuthority, true);
    const poolOutputToken = await getAssociatedTokenAddress(outputMint, poolAuthority, true);

    // Create instruction data
    const instructionData = Buffer.alloc(18);
    instructionData.writeUInt8(AmmInstruction.Swap, 0);
    instructionData.writeBigUInt64LE(BigInt(amountIn), 1);
    instructionData.writeBigUInt64LE(BigInt(minimumAmountOut), 9);
    instructionData.writeUInt8(aToB ? 1 : 0, 17);

    return new TransactionInstruction({
      keys: [
        { pubkey: user, isSigner: true, isWritable: false },
        { pubkey: poolAddress, isSigner: false, isWritable: true },
        { pubkey: poolAuthority, isSigner: false, isWritable: false },
        { pubkey: userInputToken, isSigner: false, isWritable: true },
        { pubkey: userOutputToken, isSigner: false, isWritable: true },
        { pubkey: poolInputToken, isSigner: false, isWritable: true },
        { pubkey: poolOutputToken, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: AMM_PROGRAM_ID,
      data: instructionData,
    });
  }

  /**
   * Get token balance for a user
   */
  async getTokenBalance(userPublicKey: PublicKey, mintPublicKey: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);
      const accountInfo = await getAccount(this.connection, tokenAccount);
      return Number(accountInfo.amount);
    } catch (error) {
      return 0; // Account doesn't exist or has no balance
    }
  }

  /**
   * Get token info
   */
  async getTokenInfo(mintPublicKey: PublicKey): Promise<TokenInfo | null> {
    try {
      const mintInfo = await getMint(this.connection, mintPublicKey);
      return {
        mint: mintPublicKey,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: mintInfo.decimals,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate swap output (simplified version)
   */
  calculateSwapOutput(
    inputAmount: number,
    inputReserve: number,
    outputReserve: number,
    feeRate: number = 30 // 0.3%
  ): number {
    if (inputAmount === 0 || inputReserve === 0 || outputReserve === 0) {
      return 0;
    }

    // Apply fee
    const feeAmount = Math.floor((inputAmount * feeRate) / 10000);
    const inputAfterFee = inputAmount - feeAmount;

    // Constant product formula: (x * y = k)
    const numerator = inputAfterFee * outputReserve;
    const denominator = inputReserve + inputAfterFee;

    return Math.floor(numerator / denominator);
  }

  /**
   * Calculate price impact
   */
  calculatePriceImpact(
    inputAmount: number,
    inputReserve: number,
    outputReserve: number
  ): number {
    if (inputAmount === 0 || inputReserve === 0 || outputReserve === 0) {
      return 0;
    }

    const currentPrice = outputReserve / inputReserve;
    const newInputReserve = inputReserve + inputAmount;
    const outputAmount = this.calculateSwapOutput(inputAmount, inputReserve, outputReserve);
    const newOutputReserve = outputReserve - outputAmount;
    const newPrice = newOutputReserve / newInputReserve;

    return Math.abs((newPrice - currentPrice) / currentPrice) * 100;
  }

  /**
   * Create associated token account instruction if needed
   */
  async createAssociatedTokenAccountInstructionIfNeeded(
    payer: PublicKey,
    owner: PublicKey,
    mint: PublicKey
  ): Promise<TransactionInstruction | null> {
    const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
    
    try {
      await getAccount(this.connection, associatedTokenAddress);
      return null; // Account already exists
    } catch (error) {
      // Account doesn't exist, create instruction
      return createAssociatedTokenAccountInstruction(
        payer,
        associatedTokenAddress,
        owner,
        mint
      );
    }
  }
}
