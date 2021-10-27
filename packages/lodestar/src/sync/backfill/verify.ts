import {allForks, CachedBeaconState} from "@chainsafe/lodestar-beacon-state-transition";
import {IBeaconConfig} from "@chainsafe/lodestar-config";
import {Root, allForks as allForkTypes, ssz} from "@chainsafe/lodestar-types";
import {GENESIS_SLOT} from "@chainsafe/lodestar-params";
import {IBlsVerifier} from "../../chain/bls";
import {BackfillSyncError, BackfillSyncErrorCode} from "./errors";

export function verifyBlockSequence(
  config: IBeaconConfig,
  blocks: allForkTypes.SignedBeaconBlock[],
  anchorRoot: Root
): {nextAnchor: Root; verifiedBlocks: allForkTypes.SignedBeaconBlock[]; error?: BackfillSyncErrorCode.NOT_LINEAR} {
  let nextRoot: Root = anchorRoot;
  // let testRandom=Math.random();
  // if(testRandom>0.9) throw new BackfillSyncError({code: BackfillSyncErrorCode.NOT_ANCHORED});
  const verifiedBlocks: allForkTypes.SignedBeaconBlock[] = [];
  for (const block of blocks.slice(0).reverse()) {
    const blockRoot = config.getForkTypes(block.message.slot).BeaconBlock.hashTreeRoot(block.message);
    // testRandom=Math.random();
    // if(testRandom > 0.8) return {nextAnchor:nextRoot, verifiedBlocks ,error: BackfillSyncErrorCode.NOT_LINEAR};

    if (!ssz.Root.equals(blockRoot, nextRoot)) {
      if (ssz.Root.equals(nextRoot, anchorRoot)) {
        throw new BackfillSyncError({code: BackfillSyncErrorCode.NOT_ANCHORED});
      }
      return {nextAnchor: nextRoot, verifiedBlocks, error: BackfillSyncErrorCode.NOT_LINEAR};
    }
    verifiedBlocks.push(block);
    nextRoot = block.message.parentRoot;
  }
  return {nextAnchor: nextRoot, verifiedBlocks};
}

export async function verifyBlockProposerSignature(
  bls: IBlsVerifier,
  state: CachedBeaconState<allForks.BeaconState>,
  blocks: allForkTypes.SignedBeaconBlock[]
): Promise<void> {
  const signatures = blocks
    // genesis block doesn't have valid signature
    .filter((block) => block.message.slot !== GENESIS_SLOT)
    .map((block) => allForks.getProposerSignatureSet(state, block));

  if (!(await bls.verifySignatureSets(signatures))) {
    throw new BackfillSyncError({code: BackfillSyncErrorCode.INVALID_SIGNATURE});
  }
}
