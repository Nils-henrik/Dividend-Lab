import type { DivLabResearchPacket } from "./deep-research";
import {
  buildVerifiedPeerComparison,
  peerSnapshotFromResearchPacket,
  type VerifiedPeerComparison,
  type VerifiedPeerInput,
} from "./peer-comparison";
import type {
  LoadedPeerRegistryMember,
  LoadedPeerRegistrySet,
} from "./peer-registry-read";

export const DEFAULT_PEER_RESEARCH_CONCURRENCY = 3;
export const MAX_PEER_RESEARCH_CONCURRENCY = 5;

export type MissingRegistryPeer = {
  symbol: string;
  exchange: string;
  name: string;
};

export type RegistryPeerResearchLoader = (
  member: LoadedPeerRegistryMember,
) => Promise<DivLabResearchPacket | null>;

export type RegistryPeerComparisonResult = {
  registry: {
    peerSetId: string;
    versionNumber: number;
    dataAsOf: string;
    registeredPeerCount: number;
  };
  hydration: {
    status: "complete" | "incomplete";
    hydratedPeerCount: number;
    missingPeers: MissingRegistryPeer[];
  };
  comparison: VerifiedPeerComparison;
};

function identityKey(input: { symbol: string; exchange: string }): string {
  return `${input.exchange.trim().toUpperCase()}:${input.symbol.trim().toUpperCase()}`;
}

function resolveHydrationConcurrency(value: number | undefined): number {
  const concurrency = value ?? DEFAULT_PEER_RESEARCH_CONCURRENCY;
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > MAX_PEER_RESEARCH_CONCURRENCY
  ) {
    throw new Error("peer_registry_hydration_concurrency_invalid");
  }
  return concurrency;
}

/**
 * Hydrate one immutable registry version with fresh Deep Research packets.
 *
 * The registry is authoritative for membership. Research can fill those exact
 * identities only; it cannot introduce a replacement peer or silently shrink a
 * larger registered set into a different comparison universe.
 */
export function buildPeerComparisonFromRegistry(input: {
  targetPacket: DivLabResearchPacket;
  registry: LoadedPeerRegistrySet;
  peerPackets: readonly DivLabResearchPacket[];
}): RegistryPeerComparisonResult {
  const targetKey = identityKey(input.targetPacket.instrument);
  const registryTargetKey = identityKey(input.registry.target);
  if (targetKey !== registryTargetKey) {
    throw new Error(
      `peer_registry_hydration_target_mismatch:${registryTargetKey}:${targetKey}`,
    );
  }

  const registeredMembers = new Map(
    input.registry.members.map((member) => [identityKey(member), member] as const),
  );
  if (registeredMembers.size !== input.registry.members.length) {
    throw new Error("peer_registry_hydration_registry_duplicate_member");
  }

  const packetsByIdentity = new Map<string, DivLabResearchPacket>();
  for (const packet of input.peerPackets) {
    const key = identityKey(packet.instrument);
    if (packetsByIdentity.has(key)) {
      throw new Error(`peer_registry_hydration_duplicate_packet:${key}`);
    }
    if (!registeredMembers.has(key)) {
      throw new Error(`peer_registry_hydration_unexpected_packet:${key}`);
    }
    packetsByIdentity.set(key, packet);
  }

  const hydratedPeers: VerifiedPeerInput[] = [];
  const missingPeers: MissingRegistryPeer[] = [];
  for (const [key, member] of registeredMembers) {
    const packet = packetsByIdentity.get(key);
    if (!packet) {
      missingPeers.push({
        symbol: member.symbol,
        exchange: member.exchange,
        name: member.name,
      });
      continue;
    }
    hydratedPeers.push({
      snapshot: peerSnapshotFromResearchPacket(packet),
      relationshipSourceIds: [...member.relationshipSourceIds],
    });
  }

  missingPeers.sort((a, b) => identityKey(a).localeCompare(identityKey(b)));
  hydratedPeers.sort((a, b) =>
    identityKey(a.snapshot.instrument).localeCompare(identityKey(b.snapshot.instrument)),
  );

  const baseComparison = buildVerifiedPeerComparison({
    target: peerSnapshotFromResearchPacket(input.targetPacket),
    peers: hydratedPeers,
    basisSources: input.registry.sources,
  });

  const hydrationStatus = missingPeers.length ? "incomplete" : "complete";
  const comparison: VerifiedPeerComparison = missingPeers.length
    ? {
        ...baseComparison,
        status: "insufficient",
        notes: [
          `Registry version ${input.registry.versionNumber} saknar färskt Deep Research-underlag för ${missingPeers.length} av ${input.registry.members.length} registrerade peer-bolag. DivLab använder inte en delmängd som om den vore hela peer-setet.`,
          ...baseComparison.notes,
        ],
      }
    : baseComparison;

  return {
    registry: {
      peerSetId: input.registry.peerSetId,
      versionNumber: input.registry.versionNumber,
      dataAsOf: input.registry.dataAsOf,
      registeredPeerCount: input.registry.members.length,
    },
    hydration: {
      status: hydrationStatus,
      hydratedPeerCount: hydratedPeers.length,
      missingPeers,
    },
    comparison,
  };
}

/**
 * Controlled async hydration boundary. Exactly one research lookup is requested
 * for every registered member. Lookups run through a bounded worker pool so a
 * large registry cannot accidentally fan out into an unbounded burst of live
 * research/API work. A loader may return null when a fresh packet is unavailable,
 * but it may not substitute another instrument; identity checking remains
 * authoritative in `buildPeerComparisonFromRegistry`.
 */
export async function hydratePeerComparisonFromRegistry(input: {
  targetPacket: DivLabResearchPacket;
  registry: LoadedPeerRegistrySet;
  loadPeerResearch: RegistryPeerResearchLoader;
  maxConcurrency?: number;
}): Promise<RegistryPeerComparisonResult> {
  const concurrency = resolveHydrationConcurrency(input.maxConcurrency);
  const members = input.registry.members;
  const peerPackets = new Array<DivLabResearchPacket | null>(members.length).fill(null);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= members.length) return;
      const member = members[index];
      if (!member) return;
      peerPackets[index] = await input.loadPeerResearch(member);
    }
  }

  const workerCount = Math.min(concurrency, members.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return buildPeerComparisonFromRegistry({
    targetPacket: input.targetPacket,
    registry: input.registry,
    peerPackets: peerPackets.filter(
      (packet): packet is DivLabResearchPacket => packet !== null,
    ),
  });
}
