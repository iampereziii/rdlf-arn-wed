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
  rsvpDeadline: new Date('2026-05-10'),
  adultsOnly: true,
  pixiesetUrl: 'https://daronproject.pixieset.com/arianeandjun/',
  // Set to a filename in public/video/ when the save-the-date video is ready.
  // Set to null to show the hero photo fallback.
  heroVideo: 'ARIANE.mp4' as string | null,
  // Filename in public/photos/ to use as the hero background when heroVideo is null.
  heroPhoto: 'DSC04050.jpg' as string | null,
}

export const GIFTS = {
  message:
    'Celebrating with you is the greatest gift we could ask for. We know how important your time is, and should you wish to bless us further, a monetary gift will help us begin our forever.',
}

export const DRESS_CODE = {
  ninong: 'Off white / Beige Barong & Black slacks',
  ninang: 'Long gown in Beige / Champagne',
  entourage: 'Coordinated attire as briefed by the couple',
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
    entourage: [
      { label: 'Dusty Rose', hex: '#C49A8A' },
      { label: 'Terracotta', hex: '#8B4A3A' },
    ],
    guests: [
      { label: 'Sand', hex: '#8C7A56' },
      { label: 'Taupe', hex: '#6E5E48' },
      { label: 'Espresso', hex: '#3C2E24' },
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

// Curated gallery — 20 photos spread across the full shoot.
// To swap a photo, replace its filename with another from public/photos/.
export const PHOTOS: string[] = [
  // DP series — daytime outdoor shoot
  'DP802120.jpg',
  'DP802175.jpg',
  'DP802200.jpg',
  'DP802260.jpg',
  'DP802300.jpg',
  'DP802340.jpg',
  'DP802395.jpg',
  'DP802400.jpg',
  'DP802460.jpg',
  'DP802500.jpg',
  'DP802540.jpg',
  'DP802600.jpg',
  'DP802660.jpg',
  'DP802750.jpg',
  // DSC series — garden & evening shoot
  'DSC03751.jpg',
  'DSC03850.jpg',
  'DSC03900.jpg',
  'DSC04050.jpg',
  'DSC04100.jpg',
  'DSC04200.jpg',
]
