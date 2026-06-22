// Copy-fidelity check — runs the exact-match strings from
// Deliverables/2026-06-12-av-ninjas-website-build-inputs/06-canonical-copy/
// fidelity-checklist.md against the BUILT pages (dist/).
// Usage: npm run build && node scripts/fidelity-check.mjs
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const decode = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");

const rawHome = readFileSync(resolve("dist/index.html"), "utf8");
const home = decode(rawHome);
const hvco = decode(readFileSync(resolve("dist/hvco/index.html"), "utf8"));
// Placeholder attribute lives in markup, not text — check raw HTML too.
const homeRaw = rawHome.replace(/&#39;/g, "'").replace(/&quot;/g, '"');

const mustHome = [
  // §1 CTA buttons
  "Let's Talk!",
  "Learn More",
  "No Funny Business Sounds Absolutely AWESOME! Heck yes I want to talk!!",
  "Let's Talk",
  "Book a Call!",
  // §2 hero
  "Hey! We're the AV Ninjas.",
  "We provide sound, video, and lighting for meetings and events.",
  "We work directly with EA's, Execs, Agencies and Event Planners - and our whole business is built around making it easy!",
  "Skip the headaches. Go Direct!",
  // §3 headings
  "Audiences of Every Shape and Size",
  "In Person · Hybrid · All Virtual",
  "With Live Events, Attention is the Currency",
  "Don't Lose Your Audience!",
  "The Distraction Machines in Our Pockets",
  "The Stakes have Never Been Higher!",
  "Solid AV is a Must. Headaches Optional!",
  "Sleep like a Baby",
  "Skip the Back and Forth",
  "We do the Heavy Lifting",
  "No Funny Business, Guaranteed.",
  "Can 4-6 ninjas run circles around 12 run-of-the-mill AV people?",
  "Your Inner control freak is gonna love this...",
  "Your Very Own Mission Control!",
  "A La Carte Services",
  "The numbers don't lie",
  "Let's get this nailed down!",
  "Trusted Manufacturers",
  "Full Breakdown of our Capabilities",
  "Ready to do the thing?",
  // §4 marquee
  "Sales Meetings",
  "Galas",
  "Off-Site Meetings",
  "Product Launches",
  "Executive Strategy Sessions",
  // §5 strategic informalities
  "Heww boy..",
  "For your audience that number could easily be 5-10x+!!!",
  "Absurd, right?!?",
  "Eek!!",
  "then the second..",
  "2 weeks at the beach to recover..",
  "just out of boot camp.. The ninjas just operate on a different level..",
  "from scratch.. on-site..",
  "(and because... why should the ninjas get to play with all the cool toys?)",
  '"what does AV stand for?", we\'ve got you!',
  "This is gonna be fun!",
  "You bet they can! But how??",
  // §6 nine fixes — fixed forms
  "AV Ninjas",
  "Absolutely AWESOME!",
  "Everything is Choreographed",
  "to your utter amazement",
  "Corporate AV",
  "live events are dynamic in nature",
  "(and because...",
  "Bitfocus Companion",
  "© 2026 AV Ninjas",
  // §7 comparison table
  "Upfront Costs",
  "Hidden / Surprise Costs",
  "Setup Time",
  "Crew Size (typical)",
  "Crew Competency Level",
  "Backup Systems and Redundancies",
  "Standard across All Packages",
  "Extra $ or Not Present",
  "Stress Factor",
  "0/10",
  "8/10",
  "$$$$",
  // §8 packages
  "Starting at <$5K — Meeting Essentials",
  "Solid Essentials for Clear Communication",
  "For Small-to-Medium Meetings: No Frills · No Compromises · 100% Reliable · 100% Pro",
  "Starting at <$20K — Conference Package",
  "Clean, Transparent Production",
  "The Meat and Potatoes: Standard Ballroom Setup (Audio, Video and basic Front Lighting) · Streaming Capabilities Included · All the Essentials · Insane Value through Efficiencies!",
  "Starting at <$50K — Ignition Package",
  "Where Boring Goes to Die",
  "This is gonna be fun! Unforgettable Impact · All the Sizzle of the Vegas Strip · Transformational vs. Informational · Full Engagement",
  // §9 mission control
  "(way faster than texting)",
  "Keep the whole crew apprised of last minute changes",
  "Message the presenter display via the stage display!",
  "Push updates to the Power Point in Seconds!",
  "Control the Speaker Timer Directly!",
  "Monitor Recordings, Streams, Online Meetings, and other feeds moment by moment.",
  // §10 numbers + capabilities
  "1.5 - 3.5x",
  "Typical Savings",
  "If we can't produce a paper trail for a revision, you don't pay!",
  "We think that's transactional and gross.",
  "Presentation / GFX",
  "Lighting / Scenic",
  'Perfect Cue "clickers"',
  "Streaming / Meeting Platforms",
  "Brushfire",
  // §11 footer — reduced to copyright-only per Ben (2026-06-17); the wireframe
  // link row (Get started / Our work / The ninjas / Capabilities / Contact us /
  // Updates / Join) and the email-capture (privacy line + "Your email here") were
  // removed by his explicit decision, so they're no longer expected on the page.
  "© 2026 AV Ninjas. All rights reserved.",
];

const mustNotHome = [
  // §6 broken forms
  "Ninajs",
  "AWESEOME",
  "Choregrphed",
  "amazemement",
  "Corproate",
  "dyamic",
  "becasuse",
  "Bitofcus",
  "© 2025",
  // §12 banned additions / staging errors
  "However you gather",
  "Ready to do this thing?",
  "Tech Skill Level",
  "Hidden Costs |",
  "2 - 3x",
  "Off-site Meetings",
  "Graphic / Presentation",
  "Lightning / Scenic",
  "Whew",
  "going to",
  "seamless",
  "cutting-edge",
  "elevate your event experience",
  "we've got you covered",
];

const mustHvco = [
  "Planning a meeting or event can be a bit like a juggling act:",
  "Securing the venue..",
  "Selecting a caterer and menu",
  "Invites and RSVPs",
  "Booking the talent..",
  "The list goes on...",
  "part plate spinner and part cat-herder..",
  "chocked full of stinging things",
  "chew on shards of broken glass",
  "Whether you're planning an event for 25 or 2500",
  "Audio Visual Mastery for Event Planners",
  "Everything you need to know. Nothing you don't.",
  "How to optimize for maximum connection and impact",
  "How to get the AV piece sorted in minutes, not months",
  "How to properly vet AV companies to lock in on the right partner",
  "How to apply the 80/20 principle to AV budgeting",
  "How to pull off killer production value for less than the cost of the mediocre option",
];

const mustNotHvco = [
  "Notes for Claude",
  "chock-full",
];

let failures = 0;
const check = (label, haystack, needle, expectPresent) => {
  const found = haystack.includes(needle);
  if (found !== expectPresent) {
    failures += 1;
    console.log(`FAIL [${label}] ${expectPresent ? "missing" : "banned-present"}: ${needle}`);
  }
};

for (const s of mustHome) check("home", home, s, true);
for (const s of mustNotHome) check("home", home, s, false);
for (const s of mustHvco) check("hvco", hvco, s, true);
for (const s of mustNotHvco) check("hvco", hvco, s, false);
// "Learn" button: exact short label must exist on its own (not only as part of "Learn More")
const learnButtons = (rawHome.match(/>\s*Learn\s*</g) ?? []).length;
if (learnButtons < 1) {
  failures += 1;
  console.log("FAIL [home] missing standalone `Learn` button");
}

const total =
  mustHome.length + mustNotHome.length + mustHvco.length + mustNotHvco.length + 1;
console.log(
  failures === 0
    ? `PASS — all ${total} fidelity checks passed`
    : `${failures} FAILURE(S) of ${total} checks`,
);
process.exit(failures === 0 ? 0 : 1);
