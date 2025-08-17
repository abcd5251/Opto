import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const contractDir = path.join(process.cwd(), 'opto_contract');
    const { stdout, stderr } = await execAsync(
      'npx hardhat run scripts/directHBARtoHBARXSwap.js --network hedera-testnet',
      {
        cwd: contractDir,
        timeout: 60000, // 60 seconds timeout
      }
    );

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    console.log(`stdout: ${stdout}`);
    return NextResponse.json({ 
      message: 'HBAR swap script executed successfully', 
      output: stdout 
    });
  } catch (error: any) {
    console.error(`Execution error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}