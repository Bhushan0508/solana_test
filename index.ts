import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL } from  "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, transfer } from  "@solana/spl-token";
import Web3 from "web3";

(async () => {
  // Connect to cluster
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Generate a new wallet keypair and airdrop SOL
  console.log("generating KeyPair");
  const fromWallet = Keypair.generate();
  const fromAirdropSignature = await connection.requestAirdrop(
    fromWallet.publicKey,
    LAMPORTS_PER_SOL
  );
  console.log("From wallet Public Key "+fromWallet.publicKey.toJSON());
  //console.log("From Wallet private Key"+fromWallet.privateKey.toJSON());
  //console.log("create new account");
  
  
  //console.log("Private Key "+fromWallet.secretKey.toJSON());
  //console.log( "Public Key" + Web3.utils.toHex(fromWallet.publicKey).toString());
  //console.log("Public Key" + Web3.utils.toHex(fromWallet.publicKey).toString());
  console.log("Checking Air drop")
  // Wait for airdrop confirmation
  console.log("Confirming transaction ");
  const retval = await connection.confirmTransaction(fromAirdropSignature);
  console.log("return val "+retval.value.toString());
  // Create a new token 
  console.log("Creatting Mint");
  const mint = await createMint(
    connection, 
    fromWallet,            // Payer of the transaction
    fromWallet.publicKey,  // Account that will control the minting 
    null,                  // Account that will control the freezing of the token 
    0                      // Location of the decimal place 
  );
  
  
  //console.log(mint.toString()); 
  console.log("Getting associated account from public key");
  console.log(fromWallet.publicKey.toJSON());
  // Get the token account of the fromWallet Solana address. If it does not exist, create it.
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromWallet.publicKey
  );
  console.log("fromTokenAccount "+fromTokenAccount.address.toJSON());
  
  // Generate a new wallet to receive the newly minted token
  console.log("Generating Target wallet");
  const toWallet = Keypair.generate();
  console.log(toWallet.publicKey.toJSON())
  // Get the token account of the toWallet Solana address. If it does not exist, create it.
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    toWallet.publicKey
  );
    console.log("toTokenAccount "+toTokenAccount.address.toJSON())
  // Minting 1 new token to the "fromTokenAccount" account we just returned/created.
  console.log("Getting Associated Token Account");
  let signature = await mintTo(
    connection,
    fromWallet,               // Payer of the transaction fees 
    mint,                     // Mint for the account 
    fromTokenAccount.address, // Address of the account to mint to 
    fromWallet.publicKey,     // Minting authority
    1                         // Amount to mint 
  );

  console.log("signature  "+signature.toString());
  console.log("set Authority fromWallet ")
  console.log(fromWallet.publicKey.toJSON());
  await setAuthority(
    connection,
    fromWallet,            // Payer of the transaction fees
    mint,                  // Account 
    fromWallet.publicKey,  // Current authority 
    0,                     // Authority type: "0" represents Mint Tokens 
    null                   // Setting the new Authority to null
  );
  
    console.log("transferring from "+fromWallet.publicKey.toJSON() +" to " +toWallet.publicKey.toJSON());
  signature = await transfer(
    connection,
    fromWallet,               // Payer of the transaction fees 
    fromTokenAccount.address, // Source account 
    toTokenAccount.address,   // Destination account 
    fromWallet.publicKey,     // Owner of the source account 
    1                         // Number of tokens to transfer 
  );
  console.log("Tranfer done ")
  console.log("SIGNATURE", signature);

})();