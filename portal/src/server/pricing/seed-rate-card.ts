import { PrismaClient, type QuoteAreaType } from "@prisma/client";

type EntryDef = {
  areaType: QuoteAreaType;
  size: string;
  sizeLabel: string;
  finish: string;
  finishLabel: string;
  minutes: number;
  description: string;
};

const ENTRIES: EntryDef[] = [
  // LOBBY
  { areaType: "LOBBY", size: "S", sizeLabel: "Under 500 sqft", finish: "standard", finishLabel: "Standard clean", minutes: 12, description: "Basic sweep, mop, dust" },
  { areaType: "LOBBY", size: "S", sizeLabel: "Under 500 sqft", finish: "tile", finishLabel: "Tile/stone floor", minutes: 15, description: "Mop + edge detail" },
  { areaType: "LOBBY", size: "S", sizeLabel: "Under 500 sqft", finish: "glass", finishLabel: "Glass doors/panels", minutes: 8, description: "Interior glass cleaning" },
  { areaType: "LOBBY", size: "S", sizeLabel: "Under 500 sqft", finish: "fixtures", finishLabel: "Fixtures & hardware", minutes: 6, description: "Handle, rail, mailbox polish" },
  { areaType: "LOBBY", size: "M", sizeLabel: "500-1500 sqft", finish: "standard", finishLabel: "Standard clean", minutes: 20, description: "Sweep, mop, dust all surfaces" },
  { areaType: "LOBBY", size: "M", sizeLabel: "500-1500 sqft", finish: "tile", finishLabel: "Tile/stone floor", minutes: 25, description: "Mop + grout attention" },
  { areaType: "LOBBY", size: "M", sizeLabel: "500-1500 sqft", finish: "glass", finishLabel: "Glass doors/panels", minutes: 12, description: "All glass surfaces" },
  { areaType: "LOBBY", size: "M", sizeLabel: "500-1500 sqft", finish: "fixtures", finishLabel: "Fixtures & hardware", minutes: 10, description: "All hardware + mailboxes" },
  { areaType: "LOBBY", size: "M", sizeLabel: "500-1500 sqft", finish: "premium", finishLabel: "Premium detail", minutes: 15, description: "White-glove, baseboards, vents" },
  { areaType: "LOBBY", size: "L", sizeLabel: "1500+ sqft", finish: "standard", finishLabel: "Standard clean", minutes: 35, description: "Full lobby clean" },
  { areaType: "LOBBY", size: "L", sizeLabel: "1500+ sqft", finish: "tile", finishLabel: "Tile/stone floor", minutes: 40, description: "Full floor detail" },
  { areaType: "LOBBY", size: "L", sizeLabel: "1500+ sqft", finish: "glass", finishLabel: "Glass doors/panels", minutes: 18, description: "All glass + partitions" },
  { areaType: "LOBBY", size: "L", sizeLabel: "1500+ sqft", finish: "fixtures", finishLabel: "Fixtures & hardware", minutes: 15, description: "All hardware + detail" },
  { areaType: "LOBBY", size: "L", sizeLabel: "1500+ sqft", finish: "premium", finishLabel: "Premium detail", minutes: 20, description: "White-glove everything" },

  // HALLWAYS
  { areaType: "HALLWAYS", size: "S", sizeLabel: "1-2 floors, <500 sqft", finish: "standard", finishLabel: "Standard clean", minutes: 15, description: "Sweep/vacuum, spot mop" },
  { areaType: "HALLWAYS", size: "S", sizeLabel: "1-2 floors, <500 sqft", finish: "carpet", finishLabel: "Carpet vacuum", minutes: 12, description: "Vacuum + spot treat" },
  { areaType: "HALLWAYS", size: "S", sizeLabel: "1-2 floors, <500 sqft", finish: "tile", finishLabel: "Tile mopping", minutes: 18, description: "Full mop + edges" },
  { areaType: "HALLWAYS", size: "S", sizeLabel: "1-2 floors, <500 sqft", finish: "baseboards", finishLabel: "Baseboards & ledges", minutes: 8, description: "Wipe baseboards + ledges" },
  { areaType: "HALLWAYS", size: "M", sizeLabel: "3-8 floors, 500-1500 sqft", finish: "standard", finishLabel: "Standard clean", minutes: 30, description: "Full hallway clean" },
  { areaType: "HALLWAYS", size: "M", sizeLabel: "3-8 floors, 500-1500 sqft", finish: "carpet", finishLabel: "Carpet vacuum", minutes: 25, description: "Vacuum all + spot treat" },
  { areaType: "HALLWAYS", size: "M", sizeLabel: "3-8 floors, 500-1500 sqft", finish: "tile", finishLabel: "Tile mopping", minutes: 35, description: "Mop + grout + edges" },
  { areaType: "HALLWAYS", size: "M", sizeLabel: "3-8 floors, 500-1500 sqft", finish: "baseboards", finishLabel: "Baseboards & ledges", minutes: 15, description: "All baseboards + ledges" },
  { areaType: "HALLWAYS", size: "L", sizeLabel: "9+ floors, 1500+ sqft", finish: "standard", finishLabel: "Standard clean", minutes: 50, description: "Full hallway clean" },
  { areaType: "HALLWAYS", size: "L", sizeLabel: "9+ floors, 1500+ sqft", finish: "carpet", finishLabel: "Carpet vacuum", minutes: 40, description: "Full vacuum + runners" },
  { areaType: "HALLWAYS", size: "L", sizeLabel: "9+ floors, 1500+ sqft", finish: "tile", finishLabel: "Tile mopping", minutes: 55, description: "Full mop all floors" },
  { areaType: "HALLWAYS", size: "L", sizeLabel: "9+ floors, 1500+ sqft", finish: "baseboards", finishLabel: "Baseboards & ledges", minutes: 25, description: "All baseboards" },

  // ELEVATORS
  { areaType: "ELEVATORS", size: "S", sizeLabel: "1 car", finish: "standard", finishLabel: "Standard wipe", minutes: 6, description: "Walls, buttons, floor" },
  { areaType: "ELEVATORS", size: "S", sizeLabel: "1 car", finish: "chrome", finishLabel: "Chrome polishing", minutes: 10, description: "Chrome panels, streak-free" },
  { areaType: "ELEVATORS", size: "S", sizeLabel: "1 car", finish: "glass", finishLabel: "Glass/mirror panels", minutes: 8, description: "Mirror + glass polish" },
  { areaType: "ELEVATORS", size: "S", sizeLabel: "1 car", finish: "carpet", finishLabel: "Carpet floor", minutes: 4, description: "Vacuum elevator carpet" },
  { areaType: "ELEVATORS", size: "M", sizeLabel: "2-3 cars", finish: "standard", finishLabel: "Standard wipe", minutes: 12, description: "All cars basic clean" },
  { areaType: "ELEVATORS", size: "M", sizeLabel: "2-3 cars", finish: "chrome", finishLabel: "Chrome polishing", minutes: 22, description: "All cars chrome detail" },
  { areaType: "ELEVATORS", size: "M", sizeLabel: "2-3 cars", finish: "glass", finishLabel: "Glass/mirror panels", minutes: 15, description: "All cars glass/mirror" },
  { areaType: "ELEVATORS", size: "M", sizeLabel: "2-3 cars", finish: "carpet", finishLabel: "Carpet floor", minutes: 8, description: "Vacuum all car carpets" },
  { areaType: "ELEVATORS", size: "L", sizeLabel: "4+ cars", finish: "standard", finishLabel: "Standard wipe", minutes: 20, description: "All cars basic clean" },
  { areaType: "ELEVATORS", size: "L", sizeLabel: "4+ cars", finish: "chrome", finishLabel: "Chrome polishing", minutes: 38, description: "All cars chrome detail" },
  { areaType: "ELEVATORS", size: "L", sizeLabel: "4+ cars", finish: "glass", finishLabel: "Glass/mirror panels", minutes: 25, description: "All cars glass/mirror" },
  { areaType: "ELEVATORS", size: "L", sizeLabel: "4+ cars", finish: "carpet", finishLabel: "Carpet floor", minutes: 14, description: "Vacuum all car carpets" },

  // STAIRWELLS
  { areaType: "STAIRWELLS", size: "S", sizeLabel: "1-3 floors", finish: "standard", finishLabel: "Standard sweep", minutes: 8, description: "Sweep stairs + landings" },
  { areaType: "STAIRWELLS", size: "S", sizeLabel: "1-3 floors", finish: "mopping", finishLabel: "Mop landings", minutes: 6, description: "Mop all landings" },
  { areaType: "STAIRWELLS", size: "S", sizeLabel: "1-3 floors", finish: "railings", finishLabel: "Railing wipe", minutes: 5, description: "Wipe all railings" },
  { areaType: "STAIRWELLS", size: "M", sizeLabel: "4-8 floors", finish: "standard", finishLabel: "Standard sweep", minutes: 16, description: "Sweep all stairs" },
  { areaType: "STAIRWELLS", size: "M", sizeLabel: "4-8 floors", finish: "mopping", finishLabel: "Mop landings", minutes: 12, description: "Mop all landings" },
  { areaType: "STAIRWELLS", size: "M", sizeLabel: "4-8 floors", finish: "railings", finishLabel: "Railing wipe", minutes: 10, description: "Wipe all railings" },
  { areaType: "STAIRWELLS", size: "L", sizeLabel: "9+ floors", finish: "standard", finishLabel: "Standard sweep", minutes: 28, description: "Sweep all stairs" },
  { areaType: "STAIRWELLS", size: "L", sizeLabel: "9+ floors", finish: "mopping", finishLabel: "Mop landings", minutes: 20, description: "Mop all landings" },
  { areaType: "STAIRWELLS", size: "L", sizeLabel: "9+ floors", finish: "railings", finishLabel: "Railing wipe", minutes: 15, description: "Wipe all railings" },

  // GARBAGE
  { areaType: "GARBAGE", size: "S", sizeLabel: "1 chute room", finish: "standard", finishLabel: "Standard clean", minutes: 5, description: "Empty, wipe, deodorize" },
  { areaType: "GARBAGE", size: "S", sizeLabel: "1 chute room", finish: "sanitize", finishLabel: "Deep sanitize", minutes: 8, description: "Sanitize + deodorize" },
  { areaType: "GARBAGE", size: "M", sizeLabel: "2-3 rooms", finish: "standard", finishLabel: "Standard clean", minutes: 12, description: "All rooms basic" },
  { areaType: "GARBAGE", size: "M", sizeLabel: "2-3 rooms", finish: "sanitize", finishLabel: "Deep sanitize", minutes: 18, description: "All rooms sanitize" },
  { areaType: "GARBAGE", size: "L", sizeLabel: "4+ rooms", finish: "standard", finishLabel: "Standard clean", minutes: 20, description: "All rooms basic" },
  { areaType: "GARBAGE", size: "L", sizeLabel: "4+ rooms", finish: "sanitize", finishLabel: "Deep sanitize", minutes: 30, description: "All rooms deep sanitize" },

  // WASHROOMS
  { areaType: "WASHROOMS", size: "S", sizeLabel: "1-2 fixtures", finish: "standard", finishLabel: "Standard clean", minutes: 8, description: "Clean + sanitize" },
  { areaType: "WASHROOMS", size: "S", sizeLabel: "1-2 fixtures", finish: "tile", finishLabel: "Tile scrub", minutes: 6, description: "Floor + wall tile" },
  { areaType: "WASHROOMS", size: "S", sizeLabel: "1-2 fixtures", finish: "fixtures", finishLabel: "Fixture polish", minutes: 5, description: "Taps, handles, drains" },
  { areaType: "WASHROOMS", size: "M", sizeLabel: "3-5 fixtures", finish: "standard", finishLabel: "Standard clean", minutes: 15, description: "Full clean + sanitize" },
  { areaType: "WASHROOMS", size: "M", sizeLabel: "3-5 fixtures", finish: "tile", finishLabel: "Tile scrub", minutes: 10, description: "Floor + wall tile" },
  { areaType: "WASHROOMS", size: "M", sizeLabel: "3-5 fixtures", finish: "fixtures", finishLabel: "Fixture polish", minutes: 8, description: "All fixtures polish" },
  { areaType: "WASHROOMS", size: "L", sizeLabel: "6+ fixtures", finish: "standard", finishLabel: "Standard clean", minutes: 25, description: "Full clean + sanitize" },
  { areaType: "WASHROOMS", size: "L", sizeLabel: "6+ fixtures", finish: "tile", finishLabel: "Tile scrub", minutes: 15, description: "Full tile detail" },
  { areaType: "WASHROOMS", size: "L", sizeLabel: "6+ fixtures", finish: "fixtures", finishLabel: "Fixture polish", minutes: 12, description: "All fixtures detail" },

  // GLASS
  { areaType: "GLASS", size: "S", sizeLabel: "Under 20 panels", finish: "standard", finishLabel: "Standard clean", minutes: 5, description: "Spot clean visible panels" },
  { areaType: "GLASS", size: "S", sizeLabel: "Under 20 panels", finish: "interior", finishLabel: "Interior full clean", minutes: 8, description: "All interior glass" },
  { areaType: "GLASS", size: "M", sizeLabel: "20-50 panels", finish: "standard", finishLabel: "Standard clean", minutes: 10, description: "All visible panels" },
  { areaType: "GLASS", size: "M", sizeLabel: "20-50 panels", finish: "interior", finishLabel: "Interior full clean", minutes: 18, description: "All interior glass" },
  { areaType: "GLASS", size: "L", sizeLabel: "50+ panels", finish: "standard", finishLabel: "Standard clean", minutes: 18, description: "All visible panels" },
  { areaType: "GLASS", size: "L", sizeLabel: "50+ panels", finish: "interior", finishLabel: "Interior full clean", minutes: 30, description: "Full interior glass" },

  // OTHER
  { areaType: "OTHER", size: "S", sizeLabel: "Small area", finish: "standard", finishLabel: "Standard clean", minutes: 10, description: "General cleaning" },
  { areaType: "OTHER", size: "M", sizeLabel: "Medium area", finish: "standard", finishLabel: "Standard clean", minutes: 20, description: "General cleaning" },
  { areaType: "OTHER", size: "L", sizeLabel: "Large area", finish: "standard", finishLabel: "Standard clean", minutes: 35, description: "General cleaning" },
];

export async function seedRateCard(prisma: PrismaClient) {
  const existing = await prisma.rateCard.findFirst({
    where: { isActive: true },
  });
  if (existing) {
    console.log(`Rate card already exists: ${existing.version} (${existing.id})`);
    return existing;
  }

  const rateCard = await prisma.rateCard.create({
    data: {
      version: "2026-v1",
      name: "Default",
      isActive: true,
      entries: {
        create: ENTRIES.map((e, idx) => ({
          areaType: e.areaType,
          size: e.size,
          sizeLabel: e.sizeLabel,
          finish: e.finish,
          finishLabel: e.finishLabel,
          minutes: e.minutes,
          description: e.description,
          sortOrder: idx,
        })),
      },
    },
    include: { entries: true },
  });

  console.log(`Created rate card "${rateCard.version}" with ${rateCard.entries.length} entries`);
  return rateCard;
}
