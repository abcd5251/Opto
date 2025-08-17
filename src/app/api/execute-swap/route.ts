import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const contractDir = path.join(process.cwd(), "opto_contract");
    
    // First ensure dependencies are installed
    console.log("Installing dependencies...");
    await execAsync("pnpm install", {
      cwd: contractDir,
      timeout: 120000, // 2 minutes for installation
    });
    
    console.log("Executing swap script...");
    const { stdout, stderr } = await execAsync(
      "pnpm exec hardhat run scripts/directHBARtoHBARXSwap.js --network hedera-testnet",
      {
        cwd: contractDir,
        timeout: 180000, // 3 minutes timeout
        env: { ...process.env, NODE_ENV: 'development' }
      }
    );

    if (stderr && !stderr.includes('WARN')) {
      console.error(`stderr: ${stderr}`);
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    console.log(`stdout: ${stdout}`);
    return NextResponse.json({
      message: "HBAR swap script executed successfully",
      output: stdout,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Execution error: ${message}`);
    
    // Provide more detailed error information
    if (message.includes('timeout')) {
      return NextResponse.json({ 
        error: "Script execution timed out. This may be due to network issues or slow blockchain response.",
        details: message 
      }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: "Script execution failed", 
      details: message 
    }, { status: 500 });
  }
}
