export const WEDDING = {
  groomName: 'Rodolfo III',
  brideName: 'Ariane',
  fullTitle: 'Perez – Domingo Nuptials',
  date: 'Saturday, June 13, 2026',
  ceremony: { time: '1:00 PM', label: 'Ceremony' },
  reception: { time: '4:00 PM', label: 'Reception' },
  church: {
    name: 'Minor Basilica and Parish of La Purísima Concepción',
    location: 'Santa Maria, Bulacan',
    mapUrl: 'https://maps.app.goo.gl/AcPBurBCPgnG1Lsb9',
  },
  venue: {
    name: "Angel Gabriel's Garden",
    location: 'Santa Maria, Bulacan',
    mapUrl: 'https://maps.app.goo.gl/WUuY43a2Gr4vu2g2A',
  },
  rsvpUrl: 'https://forms.gle/FiBmViyzfbf1KhKy5',
  weddingDateTime: new Date('2026-06-13T13:00:00+08:00'),
  rsvpDeadline: new Date('2026-06-06T23:59:59+08:00'),
  // Human-readable form of rsvpDeadline — keep in sync with the date above.
  rsvpDeadlineLabel: 'June 6, 2026',
  adultsOnly: true,
  pixiesetUrl: 'https://daronproject.pixieset.com/arianeandjun/',
  // Set to a filename in public/video/ when the save-the-date video is ready.
  // Set to null to show the hero photo fallback.
  heroVideo: 'ARIANE.mp4' as string | null,
  // Filename in public/photos/ to use as the hero background when heroVideo is null.
  heroPhoto: 'DSC04050.jpg' as string | null,
}

// Portfolio lead-gen: the site doubles as a showcase of Rodolfo's web work.
// The footer credit links here so impressed guests can reach out for pricing.
// Whisper-level by design — the quality sells, the credit just catches the lead.
export const CREDIT = {
  name: 'Rodolfo Perez',
  email: 'rodolfoiiiperez@yahoo.com',
  // Prefilled email subject so an inquiry arrives already framed.
  subject: "I saw your wedding site — let's talk",
}

export const GIFTS = {
  message:
    'Celebrating with you is the greatest gift we could ask for. We know how important your time is, and should you wish to bless us further, a monetary gift will help us begin our forever.',
  // Maya QR for direct monetary gifts. Filename in public/. Empty string = not
  // configured, so the QR block is hidden (mirrors heroPhoto/heroVideo pattern).
  qrImage: 'gifts/maya-qr.jpg' as string,
  qrLabel: 'Maya', // wallet name shown under the QR
  qrAccountName: '', // optional: name on the account, for guest reassurance
}

export const DRESS_CODE = {
  ninong: 'Off white / Beige Barong & Black slacks',
  ninang: 'Long gown in Beige / Champagne',
  entourage: 'Coordinated attire as briefed by the couple',
  // Filler shown in the Entourage card now that its swatches are removed.
  entourageFiller: 'Details have been shared with you directly.',
  // Shared color directive for general guests.
  guestColor: 'Brown, dark brown & chocolate brown',
  gentlemen: 'Long sleeves and slacks',
  ladies: 'Long gown or cocktail dress',
  note: 'Strictly formal. Adults-only celebration — no children except abays.',
  palette: {
    ninong: [
      { label: 'Off White', hex: '#F5F0E8' },
      { label: 'Beige', hex: '#D9C9AC' },
      { label: 'Black', hex: '#1C1C1C' },
    ],
    ninang: [
      { label: 'Beige', hex: '#D9C9AC' },
      { label: 'Champagne', hex: '#EDD5A3' },
    ],
    // Entourage swatches removed — they coordinate directly with the couple.
    // Guests: brown, dark brown & chocolate brown, light → dark. Labels are not rendered.
    guests: [
      { label: 'Brown', hex: '#7B4B2A' },
      { label: 'Dark Brown', hex: '#5C4033' },
      { label: 'Chocolate Brown', hex: '#3E2723' },
    ],
  },
}

export const ENTOURAGE = {
  principalSponsors: [
    { ninang: 'Dr. Celestine Deniña', ninong: 'Dr. Raymond Deniña' },
    { ninang: 'Atty. Joahna Gabatino-Lim', ninong: 'Engr. Ronaldo Lim' },
    { ninang: 'Mrs. Mariasilas Olivia Batac', ninong: 'Mr. Paul Michael Catalan' },
    { ninang: 'Mrs. Maria Cleofas Villafuerte', ninong: 'Mr. Raoul Domingo' },
    { ninang: 'Mrs. Kissher Rose Amurao', ninong: 'Mr. Fritz Ros Domingo' },
    { ninang: 'Mrs. Maria Lourdes Francisco', ninong: 'Engr. Emmanuel Gener' },
    { ninang: 'Mrs. Ana Liza Cruz', ninong: 'Engr. Eriberto Fabian' },
    { ninang: 'Mrs. Josephine Manarang', ninong: 'Mr. Raphael Gomez' },
    { ninang: 'Mrs. Emma Garcia', ninong: 'Architect Frederick Gimeno' },
    { ninang: 'Mrs. Evelyn Perez', ninong: 'Engr. Lamberto Gabagat' },
  ],
  bestMen: ['Rajiv Renz Cruz', 'Marcelino Francisco Jr.'],
  maidsOfHonor: ['Mikaela Serena Flores', 'Arielle Domingo'],
  groomsmen: [
    'John Carlo Paragas',
    'Aristotle Domingo',
    'Genesis Dela Cruz',
    'Liandre De Castro',
  ],
  bridesmaids: ['Stephanie Domingo', 'Mikee Alberto', 'Natsuko Watanabe', 'Mixen Rivera'],
  cord: ['Maria Allyana Villafuerte', 'John Angelo Alberto'],
  candle: ['Diana Andrea Domingo', 'Edzen Garcia'],
  veil: ['Kriz Perez-Del Prado', 'Frederick Apostol'],
  ringBearer: 'Lucas Alberto',
  bibleBearer: 'Luiz Jam Montalvo',
  coinBearer: 'Zion Catalan',
  flowerGirls: ['Alouarishel Domingo', 'Anaiah Reese Del Prado'],
  flowerLady: 'Oona Alexa Domingo',
}

// "Catch the Hearts" — tap/reaction mini game guests play while waiting
// between the ceremony and reception. Highest score on the leaderboard wins a
// prize at the reception. All game copy lives here; mechanics in Game.tsx,
// Sheet endpoints in gameSheet.ts.
export const GAME = {
  title: 'Catch the Hearts',
  tagline: 'A little game while you wait',
  instructions:
    'Tap the falling hearts before they reach the bottom. Rings are worth extra. You have 30 seconds — play as many times as you like; your best score counts.',
  prizeNote: 'The highest score by the reception wins a prize!',
  playLabel: 'Play',
  replayLabel: 'Play again',
  durationSeconds: 30,
  // Points per catch, by kind. Rings are rarer (see RING_CHANCE in Game.tsx).
  heartPoints: 1,
  ringPoints: 3,
  topN: 10,
  leaderboardTitle: 'Leaderboard',
  leaderboardEmpty: 'No scores yet — be the first!',
  leaderboardError: 'Could not load the leaderboard. Pull to refresh or try again later.',
  winnerNote: 'wins the prize',
  yourBestLabel: 'Your best',
  namePlaceholder: 'Your full name',
  nameHint: 'Use your full name so we know who to hand the prize to.',
  submitLabel: 'Save my score',
  submittingLabel: 'Saving…',
  submittedMessage: 'Score saved — watch the leaderboard!',
  submitError: 'Something went wrong saving your score. Please try again.',
  // Shown instead of the submit form when the score endpoint isn't configured.
  playOnlyNote: 'Show this score to the couple at the reception!',
  teaser: {
    heading: 'Catch the Hearts',
    copy: 'Waiting for the reception? Tap hearts, top the leaderboard, win a prize.',
    cta: 'Play the game',
  },
}

// Curated gallery — 6 photos balanced across both shoots. The full set lives
// on Pixieset (pixiesetUrl), reached via the "View full gallery" link-out.
// To swap a photo, replace its filename with another from public/photos/.
export const PHOTOS: string[] = [
  // DP series — daytime outdoor shoot
  'DP802120.jpg',
  'DP802300.jpg',
  'DP802500.jpg',
  'DP802750.jpg',
  // DSC series — garden & evening shoot
  'DSC03850.jpg',
  'DSC04050.jpg',
]
