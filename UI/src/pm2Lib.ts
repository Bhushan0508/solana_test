import pm2, { Proc, ProcessDescription, StartOptions } from 'pm2';
import { promisify } from 'util';
import { EventEmitter } from 'events';

import { Keypair, Transaction, SystemProgram, Connection, PublicKey,LAMPORTS_PER_SOL,clusterApiUrl } from "@solana/web3.js";
import { actions, utils, programs, NodeWallet} from '@metaplex/js'; 
import fs from "fs";
import Arweave from 'arweave';

import { getMint } from "@solana/spl-token";

import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { time } from 'console';
import {
  
  StakeProgram,
  Authorized,
  sendAndConfirmTransaction,
  Lockup,
} from "@solana/web3.js";
import { WalletSignTransactionError } from '@solana/wallet-adapter-base';



const connection = new Connection("https://api.devnet.solana.com");

const mintPubkey = new PublicKey("EooSCWvcsNAhtrpP6GwsWpAhRTvJhdkRHvEZzGXcqKya");
const MY_PUBLIC_KEY = '91YhvKizFmxH7dMNSFEzyzgKFBPzA3is6HbpJEmW3FjD';
export interface IProcessOutLog {
  data: string;
  at: number;
  process: {
    namespace: string;
    rev: string;
    name: string;
    pm_id: number;
  };
}

class Pm2Lib {
  private  SCRIPT_PATH = process.env.SCRIPT_PATH;
  private  MINERS = ['https://arweave.net/1147GA_fqFVfRYQ0S9Vsz7HOsJFbiCcI72-DvbplA5M', 'https://arweave.net/bwFlwHXDWm1gGjXrWm1I0lWzroH0ooTdc3dS8aeRKq0'];
  private IMAGE1 = 'https://arweave.net/1147GA_fqFVfRYQ0S9Vsz7HOsJFbiCcI72-DvbplA5M';
  private IMAGE2 = 'https://arweave.net/bwFlwHXDWm1gGjXrWm1I0lWzroH0ooTdc3dS8aeRKq0';
  private bus: EventEmitter | undefined;
  public supply = new Map();
  public minertourl = new Map();
  async getProcesses(): Promise<ProcessDescription[]> {
    const processes: ProcessDescription[] = [];
    
    this.minertourl.set('miner01.js',this.IMAGE1);
    this.minertourl.set('miner02.js',this.IMAGE2);
    for (const miner of this.MINERS) {
      const [proc] = await promisify(pm2.describe).call(pm2, miner);
      if (proc) {
        
        processes.push(proc);
      } else {
        
        processes.push({
          name: miner,
          
          pm2_env: {
            status: 'stopped',
            total: Number(this.supply.get(miner)),
            minted:'2'
          },
        });

      }
      //console.log(processes);
    }

    return processes;
  }

  async startProcess(filename: string): Promise<Proc> {
    const proc = this.getStartOptions(filename);

    return promisify<StartOptions, Proc>(pm2.start).call(pm2, proc);
  }
  async mintNFT(filename:string): Promise<Proc>{
    console.log('Minting function from PM2Lib');
    // Minting the NFT
    console.log('Getting NFT from wallet');
    const ownerPublickey = '5R2B8wX68k84onTzw9BczMZMc1Y2Uy6dNMh5MEsHTDQK';
    const nftsmetadata = await Metadata.findDataByOwner(connection, ownerPublickey);
    console.log(nftsmetadata)
    const proc = this.getStartOptions(filename);
    try{
    
    const keypair = Keypair.generate();
    console.log(keypair.publicKey.toJSON());
    const feePayerAirdropSignature = await connection.requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(feePayerAirdropSignature);
    
    const mintNFTResponse = await actions.mintNFT({
      connection,
      wallet: new NodeWallet(keypair),
      uri: 'https://34c7ef24f4v2aejh75xhxy5z6ars4xv47gpsdrei6fiowptk2nqq.arweave.net/3wXyF1wvK6ARJ_9ue-O58CMuXrz5nyHEiPFQ6z5q02E',
      maxSupply: 1

    });
  
    console.log(mintNFTResponse);
  }catch(error){
    console.log('error '+error.response);
  }
    
  
    return promisify<StartOptions, Proc>(pm2.restart).call(pm2, proc);
  }
  async stakeNFT(filename:string): Promise<Proc>{
    console.log('Stake function from PM2Lib');
    
      // const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    
      // // Get all validators, categorized by current (i.e. active) and deliquent (i.e. inactive)
      // const { current, delinquent } = await connection.getVoteAccounts();
      // console.log("current validators: ", current);
      // console.log("all validators: ", current.concat(delinquent));
      
        // Setup our connection and wallet
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const wallet = Keypair.generate();
      
        // Fund our wallet with 1 SOL
        const airdropSignature = await connection.requestAirdrop(
          wallet.publicKey,
          LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction(airdropSignature);
      
        // Create a keypair for our stake account
        const stakeAccount = Keypair.generate();
      
        // Calculate how much we want to stake
        const minimumRent = await connection.getMinimumBalanceForRentExemption(
          StakeProgram.space
        );
        const amountUserWantsToStake = LAMPORTS_PER_SOL / 2; // This is can be user input. For now, we'll hardcode to 0.5 SOL
        const amountToStake = minimumRent + amountUserWantsToStake;
      
        // Setup a transaction to create our stake account
        // Note: `StakeProgram.createAccount` returns a `Transaction` preconfigured with the necessary `TransactionInstruction`s
        const createStakeAccountTx = StakeProgram.createAccount({
          authorized: new Authorized(wallet.publicKey, wallet.publicKey), // Here we set two authorities: Stake Authority and Withdrawal Authority. Both are set to our wallet.
          fromPubkey: wallet.publicKey,
          lamports: amountToStake,
          lockup: new Lockup(0, 0, wallet.publicKey), // Optional. We'll set this to 0 for demonstration purposes.
          stakePubkey: stakeAccount.publicKey,
        });
      
        const createStakeAccountTxId = await sendAndConfirmTransaction(
          connection,
          createStakeAccountTx,
          [
            wallet,
            stakeAccount, // Since we're creating a new stake account, we have that account sign as well
          ]
        );
        console.log(`Stake account created. Tx Id: ${createStakeAccountTxId}`);
      
        // Check our newly created stake account balance. This should be 0.5 SOL.
        let stakeBalance = await connection.getBalance(stakeAccount.publicKey);
        console.log(`Stake account balance: ${stakeBalance / LAMPORTS_PER_SOL} SOL`);
      
        // Verify the status of our stake account. This will start as inactive and will take some time to activate.
        let stakeStatus = await connection.getStakeActivation(stakeAccount.publicKey);
        console.log(`Stake account status: ${stakeStatus.state}`);
      
        // With a validator selected, we can now setup a transaction that delegates our stake to their vote account.

        

              
        // To delegate our stake, we first have to select a validator. Here we get all validators and select the first active one.
        const validators = await connection.getVoteAccounts();
        const selectedValidator = validators.current[0];
        const selectedValidatorPubkey = new PublicKey(selectedValidator.votePubkey);

        // With a validator selected, we can now setup a transaction that delegates our stake to their vote account.
        const delegateTx = StakeProgram.delegate({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: wallet.publicKey,
          votePubkey: selectedValidatorPubkey,
        });

        const delegateTxId = await sendAndConfirmTransaction(connection, delegateTx, [
          wallet,
        ]);
        console.log(
          `Stake account delegated to ${selectedValidatorPubkey}. Tx Id: ${delegateTxId}`
        );

        // Check in on our stake account. It should now be activating.
        stakeStatus = await connection.getStakeActivation(stakeAccount.publicKey);
        console.log(`Stake account status: ${stakeStatus.state}`);      

        // At anytime we can choose to deactivate our stake. Our stake account must be inactive before we can withdraw funds.
        const deactivateTx = StakeProgram.deactivate({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: wallet.publicKey,
        });
        const deactivateTxId = await sendAndConfirmTransaction(
          connection,
          deactivateTx,
          [wallet]
        );
        console.log(`Stake account deactivated. Tx Id: ${deactivateTxId}`);

        // Check in on our stake account. It should now be inactive.
        stakeStatus = await connection.getStakeActivation(stakeAccount.publicKey);
        console.log(`Stake account status: ${stakeStatus.state}`);


        // Once deactivated, we can withdraw our SOL back to our main wallet
        const withdrawTx = StakeProgram.withdraw({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: wallet.publicKey,
          toPubkey: wallet.publicKey,
          lamports: stakeBalance, // Withdraw the full balance at the time of the transaction
        });

        const withdrawTxId = await sendAndConfirmTransaction(connection, withdrawTx, [
          wallet,
        ]);
        console.log(`Stake account withdrawn. Tx Id: ${withdrawTxId}`);

        // Confirm that our stake account balance is now 0
        stakeBalance = await connection.getBalance(stakeAccount.publicKey);
        console.log(`Stake account balance: ${stakeBalance / LAMPORTS_PER_SOL} SOL`);
    
    const proc = this.getStartOptions(filename);
    return promisify<StartOptions, Proc>(pm2.restart).call(pm2, proc);
  }
  async uploadNFT(filename:string): Promise<Proc>{
    console.log('Upload function from PM2Lib');

    

      const arweave = Arweave.init({
          host: 'arweave.net',
          port: 443,
          protocol: 'https',
          timeout: 30000,
          logging: false,
      });

      // Upload image to Arweave
      console.log('Reading PNG');
      const data = fs.readFileSync('/home/mango/disrupt/graticoin/poc/winit/assets/0.png');
      console.log('Creating transaction');
      const transaction = await arweave.createTransaction({
          data: data
      });
      console.log('Getting wallet ');
      transaction.addTag('Content-Type', 'image/png');
      //const wallet = await arweave.wallets.getWalletFromFile('/home/mango/mywallet.json');
      const walletJwk = await arweave.wallets.generate();
      
        // {
        //     "kty": "RSA",
        //     "n": "3WquzP5IVTIsv3XYJjfw5L-t4X34WoWHwOuxb9V8w...",
        //     "e": ...
        console.log('Getting jwkToAddress ');
        arweave.wallets.jwkToAddress(walletJwk).then((address) => {
          console.log("Address of wallet"+address);
          //1seRanklLU_1VTGkEk7P0xAwMJfA7owA1JHW5KyZKlY
            });
           
      console.log(JSON.stringify(walletJwk));
      console.log('Wallet '+walletJwk?"Wallet generated":"AN");
      await arweave.transactions.sign(transaction, walletJwk);
      console.log('Signing Transaction ');
      const response = await arweave.transactions.post(transaction);
      console.log(response);
     
      
      
      
      //console.log('Wallet '+wallet.publicKey.toJSON());
     

      const { id } = response;
      const imageUrl = id ? `https://arweave.net/${id}` : undefined;

      // Upload metadata to Arweave

      const metadata = {
          name: "Custom NFT #1",
          symbol: "CNFT",
          description:
            "A description about my custom NFT #1",
          seller_fee_basis_points: 500,
          external_url: "https://www.graticoin.godaddysites.com/",
          attributes: [
              {
                  trait_type: "NFT type",
                  value: "Custom"
              }
          ],
          collection: {
            name: "Test Collection",
            family: "Custom NFTs",
          },
          properties: {
            files: [
              {
                uri: imageUrl,
                type: "image/png",
              },
            ],
            category: "image",
            maxSupply: 10,
            creators: [
              {
                address: "5R2B8wX68k84onTzw9BczMZMc1Y2Uy6dNMh5MEsHTDQK",
                share: 100,
              },
            ],
          },
          image: imageUrl,
        }

      const metadataRequest = JSON.stringify(metadata);
      
      const metadataTransaction = await arweave.createTransaction({
          data: metadataRequest
      });
      
      metadataTransaction.addTag('Content-Type', 'application/json');
      
      await arweave.transactions.sign(metadataTransaction, walletJwk);
      
      await arweave.transactions.post(metadataTransaction);    
    

    const proc = this.getStartOptions(filename);
    return promisify<StartOptions, Proc>(pm2.restart).call(pm2, proc);
  }
  async restartProcess(filename: string): Promise<Proc> {
    this.supply.set(this.IMAGE1 , 0);
    this.supply.set(this.IMAGE2 ,0);
    console.log('FileName '+filename);

    // const ownedMetadata = await Metadata.fromAccountAddress(
    //   connection,
    //   new PublicKey(MY_PUBLIC_KEY)
    // );
     // console.log(JSON.stringify(ownedMetadata));
     
    let mint = await getMint(connection, mintPubkey);
    this.supply.set(this.minertourl.get(filename),mint.supply);
    //filename = this.minertourl.get(filename);
    console.log('Imgae1 supply '+this.supply.get(this.IMAGE1));
    console.log('Imgae2 supply  '+this.supply.get(this.IMAGE2));
    //console.log([...this.supply.entries()]);
    //console.log([...this.minertourl.entries()]);
    return promisify(pm2.restart).call(pm2, filename);
  }

  async stopProcess(filename: string): Promise<Proc> {
    return promisify(pm2.stop).call(pm2, filename);
  }

  async onLogOut(onLog: (logObj: IProcessOutLog) => void) {
    if (!this.bus) {
      this.bus = await promisify<EventEmitter>(pm2.launchBus).call(pm2)
    }
    this.bus.on('log:out', (procLog: IProcessOutLog) => {
      onLog(procLog);
    });
  }

  private getStartOptions(filename: string): StartOptions {
    const alias = filename.replace('.js', '');
    return {
      script: `${this.SCRIPT_PATH}/${filename}`,
      name: filename,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      output: `${this.SCRIPT_PATH}/${alias}.stdout.log`,
      error: `${this.SCRIPT_PATH}/${alias}.stderr.log`,
      exec_mode: 'fork',
    };
  }
}

export default new Pm2Lib();
