import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import * as borsh from 'borsh';

// Program ID - Update this with your deployed program ID
const PROGRAM_ID = new PublicKey('AMM11111111111111111111111111111111111111111');

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

// Instruction data structures
class InitializePoolData {
  instruction: number = AmmInstruction.InitializePool;
  feeRate: number;

  constructor(feeRate: number) {
    this.feeRate = feeRate;
  }
}

class AddLiquidityData {
  instruction: number = AmmInstruction.AddLiquidity;
  maxTokenA: bigint;
  maxTokenB: bigint;
  minLpTokens: bigint;

  constructor(maxTokenA: bigint, maxTokenB: bigint, minLpTokens: bigint) {
    this.maxTokenA = maxTokenA;
    this.maxTokenB = maxTokenB;
    this.minLpTokens = minLpTokens;
  }
}

class SwapData {
  instruction: number = AmmInstruction.Swap;
  amountIn: bigint;
  minimumAmountOut: bigint;
  aToB: boolean;

  constructor(amountIn: bigint, minimumAmountOut: bigint, aToB: boolean) {
    this.amountIn = amountIn;
    this.minimumAmountOut = minimumAmountOut;
    this.aToB = aToB;
  }
}

// Borsh schemas
const INITIALIZE_POOL_SCHEMA = new Map([
  [InitializePoolData, { kind: 'struct', fields: [['instruction', 'u8'], ['feeRate', 'u16']] }],
]);

const ADD_LIQUIDITY_SCHEMA = new Map([
  [AddLiquidityData, { kind: 'struct', fields: [['instruction', 'u8'], ['maxTokenA', 'u64'], ['maxTokenB', 'u64'], ['minLpTokens', 'u64']] }],
]);

const SWAP_SCHEMA = new Map([
  [SwapData, { kind: 'struct', fields: [['instruction', 'u8'], ['amountIn', 'u64'], ['minimumAmountOut', 'u64'], ['aToB', 'u8']] }],
]);

/**
 * AMM Client for interacting with the Solana AMM program
 */
export class AmmClient {
  constructor(
    private connection: Connection,
    private programId: PublicKey = PROGRAM_ID
  ) {}

  /**
   * Derive pool PDA
   */
  getPoolAddress(tokenAMint: PublicKey, tokenBMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [POOL_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive LP token mint PDA
   */
  getLpTokenMintAddress(tokenAMint: PublicKey, tokenBMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [LP_TOKEN_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive pool authority PDA
   */
  getPoolAuthorityAddress(tokenAMint: PublicKey, tokenBMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [AUTHORITY_SEED, tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      this.programId
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

    const data = borsh.serialize(INITIALIZE_POOL_SCHEMA, new InitializePoolData(feeRate));

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
      programId: this.programId,
      data: Buffer.from(data),
    });
  }

  /**
   * Create add liquidity instruction
   */
  async createAddLiquidityInstruction(
    user: PublicKey,
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    maxTokenA: bigint,
    maxTokenB: bigint,
    minLpTokens: bigint
  ): Promise<TransactionInstruction> {
    const [poolAddress] = this.getPoolAddress(tokenAMint, tokenBMint);
    const [lpTokenMint] = this.getLpTokenMintAddress(tokenAMint, tokenBMint);
    const [poolAuthority] = this.getPoolAuthorityAddress(tokenAMint, tokenBMint);

    const userTokenA = await getAssociatedTokenAddress(tokenAMint, user);
    const userTokenB = await getAssociatedTokenAddress(tokenBMint, user);
    const userLpToken = await getAssociatedTokenAddress(lpTokenMint, user);
    const poolTokenA = await getAssociatedTokenAddress(tokenAMint, poolAuthority, true);
    const poolTokenB = await getAssociatedTokenAddress(tokenBMint, poolAuthority, true);

    const data = borsh.serialize(ADD_LIQUIDITY_SCHEMA, new AddLiquidityData(maxTokenA, maxTokenB, minLpTokens));

    return new TransactionInstruction({
      keys: [
        { pubkey: user, isSigner: true, isWritable: false },
        { pubkey: poolAddress, isSigner: false, isWritable: true },
        { pubkey: poolAuthority, isSigner: false, isWritable: false },
        { pubkey: userTokenA, isSigner: false, isWritable: true },
        { pubkey: userTokenB, isSigner: false, isWritable: true },
        { pubkey: poolTokenA, isSigner: false, isWritable: true },
        { pubkey: poolTokenB, isSigner: false, isWritable: true },
        { pubkey: lpTokenMint, isSigner: false, isWritable: true },
        { pubkey: userLpToken, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: Buffer.from(data),
    });
  }

  /**
   * Create swap instruction
   */
  async createSwapInstruction(
    user: PublicKey,
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    amountIn: bigint,
    minimumAmountOut: bigint,
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

    const data = borsh.serialize(SWAP_SCHEMA, new SwapData(amountIn, minimumAmountOut, aToB));

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
      programId: this.programId,
      data: Buffer.from(data),
    });
  }

  /**
   * Get pool information
   */
  async getPoolInfo(tokenAMint: PublicKey, tokenBMint: PublicKey) {
    const [poolAddress] = this.getPoolAddress(tokenAMint, tokenBMint);
    const poolAccount = await this.connection.getAccountInfo(poolAddress);
    
    if (!poolAccount) {
      throw new Error('Pool not found');
    }

    // Parse pool data (simplified - you'd need proper borsh deserialization)
    return {
      address: poolAddress,
      data: poolAccount.data,
      // Add proper pool data parsing here
    };
  }
}

// Example usage
export async function exampleUsage() {
  const connection = new Connection('https://api.devnet.solana.com');
  const ammClient = new AmmClient(connection);
  
  // Example keypair (use your own)
  const payer = Keypair.generate();
  
  // Example token mints (use real ones)
  const tokenAMint = new PublicKey('So11111111111111111111111111111111111111112'); // SOL
  const tokenBMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
  
  try {
    // Initialize pool
    const initInstruction = await ammClient.createInitializePoolInstruction(
      payer.publicKey,
      tokenAMint,
      tokenBMint,
      30 // 0.3% fee
    );
    
    console.log('Pool initialization instruction created');
    
    // Add liquidity
    const addLiquidityInstruction = await ammClient.createAddLiquidityInstruction(
      payer.publicKey,
      tokenAMint,
      tokenBMint,
      BigInt(1000000), // 1 SOL
      BigInt(100000000), // 100 USDC
      BigInt(900000) // Min LP tokens
    );
    
    console.log('Add liquidity instruction created');
    
    // Swap
    const swapInstruction = await ammClient.createSwapInstruction(
      payer.publicKey,
      tokenAMint,
      tokenBMint,
      BigInt(100000), // 0.1 SOL
      BigInt(9000000), // Min 9 USDC
      true // SOL to USDC
    );
    
    console.log('Swap instruction created');
    
  } catch (error) {
    console.error('Error:', error);
  }
}
