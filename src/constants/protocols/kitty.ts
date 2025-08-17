import { Address } from "viem";
import { flowMainnet } from "viem/chains";

export type KittySupportedChains = typeof flowMainnet.id;

export const KITTY_CONTRACTS: Record<
  KittySupportedChains,
  {
    kitty: Address;
    ankrFLOW: Address;
  }
> = {
  [flowMainnet.id]: {
    kitty: "0x7296a9c350cad25fc69b47ec839dcf601752c3c2",
    ankrFLOW: "0x1b97100eA1D7126C4d60027e231EA4CB25314bdb",
  },
};
