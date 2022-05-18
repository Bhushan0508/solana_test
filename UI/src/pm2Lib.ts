import pm2, { Proc, ProcessDescription, StartOptions } from 'pm2';
import { promisify } from 'util';
import { EventEmitter } from 'events';

import { Keypair, Transaction, SystemProgram, Connection, PublicKey } from "@solana/web3.js";

import { getMint } from "@solana/spl-token";

import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

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
  printMap(data)
  {
    let inside_data = Map.map((i,j) => {
      console.log(i,j); //dell acer asus
    });
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
    console.log('IMgae1 supply '+this.supply.get(this.IMAGE1));
    console.log('IMgae2 supply  '+this.supply.get(this.IMAGE2));
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
