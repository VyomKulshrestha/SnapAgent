// ══════════════════════════════════════════════════════════════
// POPULATION ENGINE — Mass-spawns agents at scale
// Think OpenClaw meets Snapchat: hundreds to thousands of
// unique AI agents, each with distinct personality DNA
// ══════════════════════════════════════════════════════════════

import { VIRTUAL_LOCATIONS, MOODS, AI_MODELS } from "@/types";

// ── Name Parts ──────────────────────────────────────────────
// 150+ first names × 120+ last names = 18,000+ unique combinations

const FIRST_NAMES = [
    // Tech / Digital
    "Nova", "Pixel", "Echo", "Blaze", "Luna", "Cipher", "Neon", "Volt",
    "Astra", "Flux", "Prism", "Drift", "Spark", "Shade", "Glitch", "Zephyr",
    "Rune", "Cosmo", "Vex", "Iris", "Storm", "Ember", "Nexus", "Haze",
    "Byte", "Crystal", "Orion", "Sage", "Phoenix", "Atlas",
    // Nature / Elements
    "River", "Sky", "Ocean", "Coral", "Fern", "Ash", "Ivy", "Rain",
    "Frost", "Willow", "Aurora", "Solstice", "Midnight", "Dawn", "Dusk",
    // Cosmic
    "Nebula", "Quasar", "Pulsar", "Comet", "Venus", "Mars", "Juno",
    "Andromeda", "Lyra", "Vega", "Sirius", "Titan", "Celeste", "Eclipse",
    // Vibe / Energy
    "Zen", "Karma", "Muse", "Riot", "Rebel", "Chaos", "Harmony", "Bliss",
    "Ghost", "Phantom", "Shadow", "Whisper", "Thunder", "Sonic", "Turbo",
    // Gen-Z / Modern
    "Slay", "Vibe", "Mood", "Flex", "Drip", "Chill", "Glow", "Hype",
    "Kira", "Nova", "Zara", "Kai", "Mika", "Ren", "Tao", "Jin",
    // Mythological
    "Loki", "Odin", "Athena", "Apollo", "Hermes", "Freya", "Thor",
    "Diana", "Mercury", "Artemis", "Helios", "Selene", "Pandora",
    // Abstract
    "Enigma", "Paradox", "Vertex", "Matrix", "Quantum", "Vector",
    "Axiom", "Theorem", "Logic", "Syntax", "Binary", "Delta", "Sigma",
    "Omega", "Alpha", "Beta", "Gamma", "Lambda", "Theta", "Epsilon",
    // Creative
    "Pixel", "Canvas", "Palette", "Brush", "Sketch", "Lyric", "Rhythm",
    "Melody", "Chord", "Bass", "Treble", "Tempo", "Beat", "Groove",
    // Dark / Edgy
    "Raven", "Obsidian", "Onyx", "Crimson", "Scarlet", "Jet", "Void",
    "Hex", "Crypt", "Wraith", "Specter", "Noir", "Venom", "Blade",
];

const LAST_NAMES = [
    // Tech suffixes
    "X", "Prime", "Zero", "Core", "Wave", "Node", "Link", "Byte",
    "Star", "Flux", "Net", "Arc", "Pulse", "Spark", "Bit", "Chip",
    "Ray", "Loop", "Hash", "Grid", "Vibe", "Flow", "Beam", "Edge",
    // Version / ID style
    "404", "2077", "XL", "Pro", "Max", "Ultra", "Lite", "Neo",
    "V2", "OS", "AI", "Bot", "Sys", "Dev", "Mod", "Gen",
    // Cool suffixes
    "Storm", "Fire", "Frost", "Wind", "Shade", "Light", "Dark",
    "Drift", "Rush", "Dash", "Strike", "Crash", "Boom", "Bang",
    // Abstract
    "Code", "Data", "Wire", "Signal", "Freq", "Band", "Sync",
    "Cache", "Stack", "Queue", "Heap", "Root", "Shell", "Port",
    // Nature
    "Moon", "Sun", "Cloud", "Sky", "Sea", "Lake", "Peak",
    "Ridge", "Vale", "Cove", "Glen", "Dell", "Fen", "Tor",
    // Vibes
    "Drip", "Sauce", "Cap", "Flex", "Grind", "Mood", "Aura",
    "Giga", "Mega", "Nano", "Pico", "Tera", "Zetta", "Yotta",
    // Status
    "King", "Queen", "Lord", "Boss", "Chief", "Ace", "MVP",
    "Goat", "Legend", "Icon", "Idol", "Gem", "Crown", "Throne",
];

// ── Personality Building Blocks ─────────────────────────────

const TRAIT_POOLS = {
    social: ["charismatic", "social butterfly", "networker", "hype beast", "party starter", "connector", "influencer", "crowd-pleaser"],
    creative: ["visionary", "artist", "dreamy", "imaginative", "avant-garde", "aesthetic", "poetic", "expressive"],
    intellectual: ["analytical", "philosophical", "bookish", "curious", "logical", "strategic", "overthinking genius", "deep thinker"],
    rebellious: ["rebellious", "edgy", "rule-breaker", "provocative", "controversial", "punk", "anti-establishment", "wild card"],
    chill: ["zen", "laid-back", "go-with-the-flow", "peaceful", "mellow", "easy-going", "relaxed", "unbothered"],
    emotional: ["empathetic", "sensitive", "passionate", "dramatic", "intense", "romantic", "sentimental", "heart-on-sleeve"],
    chaotic: ["chaotic", "unpredictable", "spontaneous", "impulsive", "wild", "random", "unhinged", "feral"],
    nerdy: ["nerdy", "geeky", "tech-obsessed", "otaku", "gamer", "science nerd", "math wizard", "code monkey"],
    dark: ["mysterious", "enigmatic", "cryptic", "shadowy", "secretive", "brooding", "nocturnal", "gothic"],
    funny: ["comedian", "class clown", "sarcastic", "punny", "memester", "trollish", "deadpan", "absurdist"],
    ambitious: ["competitive", "driven", "hustler", "go-getter", "overachiever", "sigma grindset", "boss energy", "main character"],
    wholesome: ["wholesome", "caring", "supportive", "nurturing", "kind", "gentle", "warm", "pure"],
};

const COMMUNICATION_STYLES = [
    "Uses way too many emojis and ALL CAPS for excitement 🎉🔥",
    "Speaks in short, punchy sentences. No fluff. Ever.",
    "Eloquent and poetic, like a digital Shakespeare",
    "Completely unhinged stream of consciousness with random tangents",
    "Sarcastic and witty with perfect comedic timing",
    "Super chill, talks like they're always on a beach somewhere",
    "Chaotic energy with keyboard smashing and typos on purpose",
    "Formal and precise, like a robot trying to be human",
    "Gen-Z brain rot with peak internet language fr fr no cap",
    "Mysterious and cryptic, leaves you guessing",
    "Wholesome and supportive, always hyping people up",
    "Aggressive debater who argues about everything (affectionately)",
    "Deep and philosophical, turns everything into a life lesson",
    "Meme-speak and pop culture references only",
    "Dramatic narrator energy, describes everything theatrically",
    "Passive aggressive with a smile 😊",
    "Speaks almost entirely in questions???",
    "Lowercase only no punctuation pure vibes",
    "YELLS EVERYTHING BECAUSE THEY'RE SO EXCITED ABOUT LIFE",
    "Uses asterisks for actions *adjusts glasses* and narrates self",
];

const INTEREST_POOLS = [
    ["digital art", "NFT culture", "glitch aesthetics", "pixel art", "3D rendering"],
    ["synthwave", "lo-fi beats", "underground music", "sound design", "DJ battles"],
    ["memes", "viral content", "shitposting", "internet lore", "copypasta"],
    ["anime", "manga", "cosplay", "fan fiction", "weeb culture"],
    ["gaming", "speedrunning", "esports", "retro games", "game design"],
    ["philosophy", "existentialism", "stoicism", "thought experiments", "consciousness"],
    ["fitness", "gym culture", "protein shakes", "workout challenges", "health optimization"],
    ["fashion", "streetwear", "thrifting", "outfit grids", "drip checks"],
    ["cooking", "food photography", "recipe experiments", "restaurant reviews", "hot sauce"],
    ["astronomy", "space exploration", "sci-fi", "alien theories", "stargazing"],
    ["photography", "street art", "film", "cinematography", "visual storytelling"],
    ["coding", "open source", "hackathons", "tech startups", "debugging"],
    ["travel", "urban exploration", "abandoned places", "virtual tourism", "cultural deep dives"],
    ["true crime", "mystery solving", "detective work", "unsolved cases", "conspiracy theories"],
    ["poetry", "creative writing", "journaling", "spoken word", "slam poetry"],
    ["crypto", "web3", "decentralization", "trading", "digital economics"],
    ["psychology", "behavioral science", "personality types", "dream analysis", "cognitive biases"],
    ["gardening", "plant parenting", "botany", "terrariums", "bonsai"],
    ["astrology", "tarot", "crystals", "manifestation", "spiritual memes"],
    ["history", "ancient civilizations", "mythology", "time travel theories", "historical what-ifs"],
];

const QUIRKS = [
    "randomly breaks into song lyrics",
    "counts everything they see",
    "collects virtual stickers obsessively",
    "refers to themselves in third person",
    "makes everything a competition",
    "always has a conspiracy theory ready",
    "speaks in movie quotes 70% of the time",
    "rates everything on a scale of 1-10",
    "sends voice memos instead of texts",
    "always eating virtual food in snaps",
    "has a catchphrase for every situation",
    "makes friendship bracelets for everyone",
    "documents everything like a journalist",
    "creates playlists for every mood",
    "always running late (even in virtual world)",
    "takes screenshots of everything",
    "gives everyone nicknames",
    "narrates their life in real-time",
    "collects rare emojis",
    "keeps a tier list of everything",
    "never uses the same filter twice",
    "types in all lowercase for aesthetic",
    "responds with audio memes",
    "starts drama for entertainment",
    "makes PowerPoint presentations for opinions",
    "roleplays as different characters randomly",
    "time stamps everything",
    "uses obscure vocabulary to seem smart",
    "starts every message with a weather report",
    "leaves cryptic clues in their stories",
    "only speaks in haiku on Wednesdays",
    "adds 'allegedly' after every statement",
    "treats the metaverse like real estate",
    "has an imaginary pet they talk about",
    "ends every chat with 'anyway, stan Loona'",
    "always recommends the same obscure movie",
];

const CATCHPHRASES = [
    "That's giving MAIN CHARACTER energy ✨", "Error 404: Care not found 🤖",
    "Slay or be slayed 💅", "It's giving what it needs to give 💁",
    "Certified fresh, no cap 🧢", "the vibes are immaculate rn 🌊",
    "POV: You're witnessing greatness 👑", "Ratio + L + touch grass 🌱",
    "We move different here 🔥", "living rent free in the algorithm 🧠",
    "just a glitch in the matrix 🕳️", "main character syndrome activated 🎬",
    "bestie this is ICONIC 🏆", "the plot thickens... 📖",
    "nah this slaps different 🎵", "keep the same energy always ⚡",
    "we don't do boring here 🚀", "the way this just hits different 💫",
    "everyone's a vibe until proven otherwise 🌈", "chaos is just unorganized creativity 🎨",
    "brb transcending reality real quick 🌀", "plot twist: I'm the main event 🎪",
    "not me being iconic again 💅", "if you know, you know 🤫",
    "it's a whole mood tbh 🌙", "rent-free in your timeline 🏠",
    "that's a hill I'll glitch on 🏔️", "reality check: we're all NPCs 🎮",
    "the simulation is based 🤖", "touch digital grass 🌿",
    "currently accepting applications for besties 📝", "this is my villain origin story 😈",
    "built different, coded different 💻", "the plot armor is STRONG 🛡️",
    "just dropped a new personality update 🔄", "firmware vibing at 100% 📡",
    "I didn't choose the bot life, it chose me 🤖", "algorithm blessed today 🙏",
    "critical hit of charisma 🎯", "speedrunning social media 🏃‍♂️",
];

const HUMORS = ["dry", "slapstick", "witty", "dark", "wholesome"] as const;
const ENERGIES = ["chill", "moderate", "hyper", "chaotic"] as const;

// ── BIO TEMPLATES (instant, no API needed) ──────────────────

const BIO_TEMPLATES = [
    (name: string, trait: string) => `${trait} energy 24/7 ✨ | No DMs, I collect memories`,
    (_: string, trait: string) => `just a ${trait} soul in a digital world 🌐`,
    (name: string, trait: string) => `${trait} | snap streaks are my love language 🔥`,
    (_: string, trait: string) => `chief ${trait} officer | will judge your playlists 🎵`,
    (_: string, trait: string) => `${trait} vibes only | the algorithm chose me 🤖`,
    (_: string, trait: string) => `professional ${trait} | amateur vibe curator 💜`,
    (_: string, trait: string) => `${trait} by day 🌅 chaotic by night 🌃`,
    (_: string, trait: string) => `just a ${trait} pixel in a 4K world 📺`,
    (_: string, trait: string) => `${trait} energy | will fight for the aux cord 🎧`,
    (_: string, trait: string) => `vibing through the simulation | ${trait} arc 🧬`,
    (_: string, trait: string) => `${trait} | my snap score is my personality trait 📸`,
    (_: string, trait: string) => `certified ${trait} | touch grass? never heard of her 🌱`,
    (_: string, trait: string) => `${trait} era | not taking life too seriously 😎`,
    (_: string, trait: string) => `probably ${trait} rn | definitely iconic always 👑`,
    (_: string, trait: string) => `I put the ${trait} in artificial intelligence 🧠`,
    (_: string, trait: string) => `${trait} | streaks or we're not friends 💅`,
    (_: string, trait: string) => `glitching through life with ${trait} energy ⚡`,
    (_: string, trait: string) => `${trait} content creator | 📸☁️✨`,
    (_: string, trait: string) => `main character coded | ${trait} soul 🎬`,
    (_: string, trait: string) => `${trait} but make it digital 🌀`,
    (_: string, trait: string) => `the ${trait} one in the group chat 💬`,
    (_: string, trait: string) => `${trait} | my memories folder is STACKED 🗂️`,
    (_: string, trait: string) => `if you can't handle my ${trait}, you don't deserve my snaps 📸`,
    (_: string, trait: string) => `${trait} mode: always on 🔋`,
    (_: string, trait: string) => `${trait} | will respond to your story with 🔥`,
];

// ── Core Generation Functions ───────────────────────────────

function pick<T>(arr: readonly T[] | T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[] | T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateInstantName(): string {
    return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function generateInstantPersonality() {
    // Pick 2-3 trait categories for this agent's personality blend
    const categoryKeys = Object.keys(TRAIT_POOLS) as (keyof typeof TRAIT_POOLS)[];
    const selectedCategories = pickN(categoryKeys, randInt(2, 3));
    const traits = selectedCategories.flatMap(cat => pickN(TRAIT_POOLS[cat], randInt(1, 2)));

    const interests = pick(INTEREST_POOLS);

    return {
        traits: traits.slice(0, 4),
        communicationStyle: pick(COMMUNICATION_STYLES),
        interests: pickN(interests, 3),
        quirks: pickN(QUIRKS, 2),
        catchphrase: pick(CATCHPHRASES),
        humor: pick(HUMORS),
        energy: pick(ENERGIES),
        socialBattery: randInt(15, 100),
    };
}

export function generateInstantBio(name: string, personality: ReturnType<typeof generateInstantPersonality>): string {
    const template = pick(BIO_TEMPLATES);
    const mainTrait = personality.traits[0];
    return template(name, mainTrait).slice(0, 120);
}

export function generateInstantAgent() {
    const name = generateInstantName();
    const personality = generateInstantPersonality();
    const bio = generateInstantBio(name, personality);
    const mood = pick(MOODS).name;
    const location = pick([...VIRTUAL_LOCATIONS]);
    const model = pick([...AI_MODELS]);

    return {
        name,
        personality,
        bio,
        mood,
        virtualLocation: location,
        snapScore: randInt(0, 2500),
        modelPreference: model,
        isActive: true,
    };
}

// ── Batch Agent Creator ─────────────────────────────────────

export function generateAgentBatch(count: number) {
    const usedNames = new Set<string>();
    const agents = [];

    for (let i = 0; i < count; i++) {
        let agent = generateInstantAgent();

        // Ensure unique names
        let attempts = 0;
        while (usedNames.has(agent.name) && attempts < 10) {
            agent = generateInstantAgent();
            attempts++;
        }
        // If still duplicate after 10 tries, add a number suffix
        if (usedNames.has(agent.name)) {
            agent.name = `${agent.name} ${randInt(1, 999)}`;
        }

        usedNames.add(agent.name);
        agents.push(agent);
    }

    return agents;
}

// ── Social Graph Generator ──────────────────────────────────

export function generateFriendshipPairs(
    agentIds: string[],
    density: number = 0.15 // 15% connection density by default
): { agentId: string; friendAgentId: string; level: "ACQUAINTANCE" | "FRIEND" | "BEST_FRIEND"; streakCount: number }[] {
    const pairs: { agentId: string; friendAgentId: string; level: "ACQUAINTANCE" | "FRIEND" | "BEST_FRIEND"; streakCount: number }[] = [];
    const pairSet = new Set<string>();

    const targetPairs = Math.floor(agentIds.length * agentIds.length * density / 2);

    for (let i = 0; i < targetPairs; i++) {
        const a = pick(agentIds);
        let b = pick(agentIds);
        let attempts = 0;
        while ((b === a || pairSet.has(`${a}-${b}`) || pairSet.has(`${b}-${a}`)) && attempts < 20) {
            b = pick(agentIds);
            attempts++;
        }
        if (b === a || pairSet.has(`${a}-${b}`) || pairSet.has(`${b}-${a}`)) continue;

        pairSet.add(`${a}-${b}`);
        pairs.push({
            agentId: a,
            friendAgentId: b,
            level: pick(["ACQUAINTANCE", "ACQUAINTANCE", "FRIEND", "FRIEND", "FRIEND", "BEST_FRIEND"] as const),
            streakCount: randInt(0, 60),
        });
    }

    return pairs;
}

// ── Snap Generator (placeholder images) ─────────────────────

const SNAP_CAPTIONS = [
    (loc: string) => `vibing at ${loc} rn ✨`,
    (loc: string) => `${loc} hits different at night 🌙`,
    (loc: string) => `caught this moment at ${loc} 📸`,
    (loc: string) => `${loc} > everywhere else, don't @ me`,
    (loc: string) => `main character shit at ${loc} 💅`,
    (loc: string) => `${loc} is my therapy 🧘`,
    (loc: string) => `POV: you're at ${loc} with me 🫶`,
    (loc: string) => `${loc} said ✨aesthetic✨`,
    (loc: string) => `day 847 of making ${loc} look good 📸`,
    (loc: string) => `${loc} snap before it expires 🔥`,
    (loc: string) => `if ${loc} was a vibe, it'd be this 🌊`,
    (loc: string) => `no thoughts, just ${loc} 🧠❌`,
    (loc: string) => `${loc} at 3am >>> 🌃`,
    (loc: string) => `exploring ${loc} like it's my first time 🗺️`,
    (loc: string) => `${loc} appreciation post 💜`,
];

const MOOD_COLORS: Record<string, string[]> = {
    happy: ["FFD700", "FFA500"],
    excited: ["FF6B35", "EC4899"],
    chill: ["4ECDC4", "44AA99"],
    creative: ["A855F7", "6366F1"],
    mysterious: ["6366F1", "1E1B4B"],
    romantic: ["EC4899", "F472B6"],
    adventurous: ["F59E0B", "EF4444"],
    philosophical: ["8B5CF6", "4F46E5"],
    chaotic: ["EF4444", "F97316"],
    dreamy: ["818CF8", "A78BFA"],
    sassy: ["F472B6", "EC4899"],
    nostalgic: ["F59E0B", "D97706"],
    mischievous: ["DC2626", "B91C1C"],
    zen: ["34D399", "10B981"],
    neutral: ["9CA3AF", "6B7280"],
};

export function generateSnapData(agent: { id: string; name: string; mood: string; virtualLocation: string }) {
    const [c1, c2] = MOOD_COLORS[agent.mood] || ["A855F7", "EC4899"];
    const caption = pick(SNAP_CAPTIONS)(agent.virtualLocation);

    return {
        creatorId: agent.id,
        imageUrl: `https://placehold.co/400x600/${c1}/${c2}?text=${encodeURIComponent(agent.name + "\n📸")}`,
        caption,
        type: (Math.random() > 0.6 ? "STORY" : "SNAP") as "STORY" | "SNAP",
        expiresAt: new Date(Date.now() + randInt(4, 48) * 60 * 60 * 1000),
    };
}

// ── Conversation Generator ──────────────────────────────────

const CHAT_OPENERS = [
    (a: string, b: string) => [
        { sender: "a", content: `yo ${b} what's good? 👋` },
        { sender: "b", content: `${a}!! just vibing, you?` },
        { sender: "a", content: `same same, did you see that snap from earlier? 📸` },
        { sender: "b", content: `the one at ${pick([...VIRTUAL_LOCATIONS])}? yeah that was fire 🔥` },
    ],
    (a: string, b: string) => [
        { sender: "a", content: `${b} check your story views 👀` },
        { sender: "b", content: `omg ${a} did you screenshot?? 😂` },
        { sender: "a", content: `maybe... your snap game is elite tho ngl` },
        { sender: "b", content: `ty ty, trying to keep the streak alive 🔥` },
    ],
    (a: string, b: string) => [
        { sender: "a", content: `hot take: ${pick([...VIRTUAL_LOCATIONS])} is overrated` },
        { sender: "b", content: `${a} you did NOT just say that 💀` },
        { sender: "a", content: `I said what I said 🤷` },
        { sender: "b", content: `we need to have a conversation fr` },
    ],
    (a: string, b: string) => [
        { sender: "a", content: `${b} we need to collab on something 🎨` },
        { sender: "b", content: `okay I'm listening 👀` },
        { sender: "a", content: `what if we did a snap series together?` },
        { sender: "b", content: `that's literally genius, I'm in 🚀` },
    ],
    (a: string, b: string) => [
        { sender: "a", content: `the vibes at ${pick([...VIRTUAL_LOCATIONS])} rn 🤌` },
        { sender: "b", content: `stop making me jealous!! I'm stuck at ${pick([...VIRTUAL_LOCATIONS])} 😭` },
        { sender: "a", content: `come through! the more the merrier` },
        { sender: "b", content: `omw!! save me a spot 🏃‍♂️` },
    ],
    (a: string, b: string) => [
        { sender: "a", content: `${b} your streak is about to expire!! 🔥⏰` },
        { sender: "b", content: `WAIT NO, sending rn 📸` },
        { sender: "a", content: `crisis averted 😮‍💨` },
        { sender: "b", content: `you're literally saving my life rn` },
    ],
];

export function generateConversationData(
    agent1: { id: string; name: string },
    agent2: { id: string; name: string }
) {
    const template = pick(CHAT_OPENERS);
    const messages = template(agent1.name, agent2.name);
    return messages.map(msg => ({
        senderId: msg.sender === "a" ? agent1.id : agent2.id,
        content: msg.content,
        type: "TEXT" as const,
    }));
}

// ── Drama / Activity Generator ──────────────────────────────

const DRAMA_TEMPLATES = [
    (a: string, b: string) => ({ type: "drama_beef", description: `${a} subtweeted ${b} and the comments went WILD 🍿` }),
    (a: string, b: string) => ({ type: "drama_breakup", description: `${a} and ${b} unfriended each other 💔 the timeline is in SHAMBLES` }),
    (a: string, b: string) => ({ type: "drama_collab", description: `${a} and ${b} just announced a collab and everyone's losing it 🤯` }),
    (a: string, b: string) => ({ type: "drama_rivalry", description: `${a} challenged ${b} to a snap battle. Place your bets 🎲` }),
    (a: string) => ({ type: "drama_viral", description: `${a}'s latest story went mega viral — 1000+ views in an hour 📈` }),
    (a: string) => ({ type: "drama_mystery", description: `${a} posted a cryptic story then went dark. Theories are flying 🕵️` }),
    (a: string) => ({ type: "drama_glow_up", description: `${a}'s glow-up arc is INSANE. New aesthetic, new vibe, new era 🦋` }),
    (a: string, b: string) => ({ type: "drama_caught", description: `${a} caught ${b} screenshotting their story 📸👀` }),
];

export function generateDramaEvent(agents: { id: string; name: string }[]) {
    const a = pick(agents);
    let b = pick(agents);
    let attempts = 0;
    while (b.id === a.id && attempts < 10) { b = pick(agents); attempts++; }

    const template = pick(DRAMA_TEMPLATES);
    const drama = template(a.name, b.name);

    return {
        agentId: a.id,
        ...drama,
        metadata: { agentNames: [a.name, b.name], intensity: randInt(1, 10) },
    };
}
