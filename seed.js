// seed.js — populates the destinations table with sample data.
// Run with: npm run seed
const db = require("./db");

const destinations = [
  {
    name: "Santorini",
    country: "Greece",
    category: "Islands",
    price_per_person: 42000,
    duration_days: 6,
    rating: 4.8,
    description:
      "Whitewashed clifftop villages, blue-domed churches and some of the best sunsets on the planet. Base yourself in Oia and spend your days island-hopping the Aegean.",
    highlights: ["Sunset in Oia", "Volcano boat tour", "Wine tasting at a clifftop winery", "Red Beach"],
    image_seed: "santorini-01",
    image_hue: "sunset"
  },
  {
    name: "Kyoto",
    country: "Japan",
    category: "Culture",
    price_per_person: 58000,
    duration_days: 8,
    rating: 4.9,
    description:
      "Thousands of temples, bamboo groves and geisha districts frozen in time. Kyoto rewards slow travel — quiet mornings at shrines before the crowds arrive.",
    highlights: ["Fushimi Inari torii gates", "Arashiyama bamboo grove", "Gion district walk", "Kaiseki dinner"],
    image_seed: "kyoto-02",
    image_hue: "forest"
  },
  {
    name: "Bali",
    country: "Indonesia",
    category: "Islands",
    price_per_person: 35000,
    duration_days: 7,
    rating: 4.6,
    description:
      "Rice terraces, surf breaks and jungle temples. Split your trip between Ubud's calm and Canggu's beach-club energy.",
    highlights: ["Tegallalang rice terraces", "Uluwatu temple at sunset", "Surf lessons in Canggu", "Waterfall trekking"],
    image_seed: "bali-03",
    image_hue: "forest"
  },
  {
    name: "Reykjavik & the Ring Road",
    country: "Iceland",
    category: "Nature",
    price_per_person: 89000,
    duration_days: 9,
    rating: 4.9,
    description:
      "Glaciers, geysers and the chance of the northern lights. A self-drive loop past waterfalls, black-sand beaches and geothermal pools.",
    highlights: ["Golden Circle", "Jökulsárlón glacier lagoon", "Blue Lagoon", "Northern lights hunting"],
    image_seed: "iceland-04",
    image_hue: "ice"
  },
  {
    name: "Machu Picchu Trek",
    country: "Peru",
    category: "Adventure",
    price_per_person: 67000,
    duration_days: 5,
    rating: 4.9,
    description:
      "Hike the Inca Trail through cloud forest and mountain passes to reach the lost city at sunrise, before the day-trippers arrive.",
    highlights: ["Inca Trail trek", "Sacred Valley", "Sunrise at the Sun Gate", "Cusco old town"],
    image_seed: "machu-05",
    image_hue: "forest"
  },
  {
    name: "Swiss Alps",
    country: "Switzerland",
    category: "Nature",
    price_per_person: 95000,
    duration_days: 6,
    rating: 4.7,
    description:
      "Cable cars to 3,000m viewpoints, alpine lakes and villages that look staged for a postcard. Interlaken makes a perfect base.",
    highlights: ["Jungfraujoch cable car", "Lake Brienz kayaking", "Grindelwald first cliff walk", "Swiss rail scenic route"],
    image_seed: "alps-06",
    image_hue: "ice"
  },
  {
    name: "Maldives Overwater",
    country: "Maldives",
    category: "Islands",
    price_per_person: 112000,
    duration_days: 5,
    rating: 4.8,
    description:
      "Overwater villas, house-reef snorkeling and water so clear you can see the seabed from the boat. Built for slowing all the way down.",
    highlights: ["Overwater villa stay", "Reef snorkeling", "Sunset dolphin cruise", "Private sandbank picnic"],
    image_seed: "maldives-07",
    image_hue: "sunset"
  },
  {
    name: "Marrakech & the Atlas",
    country: "Morocco",
    category: "Culture",
    price_per_person: 39000,
    duration_days: 6,
    rating: 4.5,
    description:
      "Souks, riads and the High Atlas mountains a short drive from the medina walls. Equal parts chaos and calm.",
    highlights: ["Jemaa el-Fnaa square", "Atlas Mountains day trip", "Riad courtyard stay", "Desert camp under the stars"],
    image_seed: "marrakech-08",
    image_hue: "sunset"
  },
  {
    name: "New Zealand South Island",
    country: "New Zealand",
    category: "Adventure",
    price_per_person: 98000,
    duration_days: 10,
    rating: 4.9,
    description:
      "Fjords, glaciers and every adventure sport invented in one country. A road trip from Queenstown to Milford Sound.",
    highlights: ["Milford Sound cruise", "Queenstown bungee", "Franz Josef glacier hike", "Lake Tekapo stargazing"],
    image_seed: "nz-09",
    image_hue: "ice"
  },
  {
    name: "Dubai City Break",
    country: "United Arab Emirates",
    category: "City",
    price_per_person: 51000,
    duration_days: 4,
    rating: 4.4,
    description:
      "Desert dunes minutes from record-breaking towers. A short, high-contrast trip between old souks and new skylines.",
    highlights: ["Burj Khalifa observation deck", "Desert safari & dinner", "Dubai Marina walk", "Gold and spice souks"],
    image_seed: "dubai-10",
    image_hue: "sunset"
  },
  {
    name: "Amalfi Coast",
    country: "Italy",
    category: "Culture",
    price_per_person: 72000,
    duration_days: 7,
    rating: 4.7,
    description:
      "Pastel towns stacked on cliffs, lemon groves and coastal drives that demand you stop every ten minutes for a photo.",
    highlights: ["Positano coastal walk", "Path of the Gods hike", "Capri boat day", "Limoncello tasting"],
    image_seed: "amalfi-11",
    image_hue: "sunset"
  },
  {
    name: "Banff National Park",
    country: "Canada",
    category: "Nature",
    price_per_person: 76000,
    duration_days: 8,
    rating: 4.8,
    description:
      "Turquoise glacial lakes and the Canadian Rockies. Good hiking for every level and wildlife around nearly every bend.",
    highlights: ["Lake Louise canoe", "Moraine Lake sunrise", "Icefields Parkway drive", "Wildlife spotting"],
    image_seed: "banff-12",
    image_hue: "ice"
  }
];

const insert = db.prepare(`
  INSERT INTO destinations
    (name, country, category, price_per_person, duration_days, rating, description, highlights, image_seed, image_hue)
  VALUES (@name, @country, @category, @price_per_person, @duration_days, @rating, @description, @highlights, @image_seed, @image_hue)
`);

const existing = db.prepare("SELECT COUNT(*) AS count FROM destinations").get();

if (existing.count > 0) {
  console.log(`Skipping seed — ${existing.count} destinations already in the database.`);
  console.log("Delete backend/voyago.sqlite and re-run 'npm run seed' to reseed from scratch.");
} else {
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run({ ...row, highlights: JSON.stringify(row.highlights) });
    }
  });
  insertMany(destinations);
  console.log(`Seeded ${destinations.length} destinations into voyago.sqlite`);
}
