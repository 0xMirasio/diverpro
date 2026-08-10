import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error("Demo data is disabled in production. Set ALLOW_DEMO_SEED=true only in an isolated test environment.");
}

const prisma = new PrismaClient();
const demoPassword = "DemoDive2026!";

function futureDate(monthsFromNow, day, hour = 9) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsFromNow, day, hour));
}

const demoDivers = [
  {
    publicId: "gorge-martin",
    firstName: "Gorge",
    lastName: "Martin",
    username: "gorge.blue",
    email: "gorge@demo.bluemates.test",
    locale: "fr",
    birthDate: new Date("1988-04-12T00:00:00.000Z"),
    bio: "Photographe sous-marin, amateur de tombants et toujours partant pour une plongée au lever du soleil.",
    dives: [
      ["10000000-0000-4000-8000-000000000001", "2026-06-18", "Banana Reef, Maldives", 27.4, 52, "Raies, bancs de vivaneaux et courant modéré. Mise à l’eau depuis un dhoni.", 4.2422, 73.5424, "PUBLIC"],
      ["10000000-0000-4000-8000-000000000002", "2026-06-20", "Maaya Thila, Maldives", 30.1, 48, "Plongée crépusculaire avec requins gris et tortue imbriquée.", 4.0821, 72.8974, "PUBLIC"],
      ["10000000-0000-4000-8000-000000000003", "2026-03-09", "Le Liban, Marseille", 35.8, 44, "Belle exploration de l’épave, eau fraîche et excellente visibilité sous 25 mètres.", 43.2504, 5.2918, "PUBLIC"],
      ["10000000-0000-4000-8000-000000000004", "2025-10-14", "Îles Chafarinas, Maroc", 24.6, 57, "Mérous, corail orange et relief rocheux spectaculaire.", 35.1792, -2.4285, "PUBLIC"],
      ["10000000-0000-4000-8000-000000000005", "2025-07-22", "Blue Hole, Gozo", 31.2, 46, "Plongée personnelle d’entraînement photo.", 36.053, 14.1889, "PRIVATE"],
    ],
    plans: [
      ["20000000-0000-4000-8000-000000000001", 3, 8, "Ras Mohammed, Égypte", "Vacances mer Rouge : deux plongées bateau, tombant et récif de Shark Reef.", 27.7317, 34.2547, "PUBLIC"],
      ["20000000-0000-4000-8000-000000000002", 7, 16, "Cenote Dos Ojos, Mexique", "Séjour au Yucatán et découverte des cénotes avec un guide cavern.", 20.3247, -87.3917, "PUBLIC"],
    ],
    reviews: [
      ["30000000-0000-4000-8000-000000000001", "Maaya Thila, Maldives", 4.0821, 72.8974, 5, "Un site exceptionnel au coucher du soleil. Beaucoup de vie et une équipe locale très attentive."],
      ["30000000-0000-4000-8000-000000000002", "Le Liban, Marseille", 43.2504, 5.2918, 4, "Épave magnifique pour les plongeurs confirmés. Prévoir une bonne protection thermique."],
    ],
  },
  {
    publicId: "lucas-bernard",
    firstName: "Lucas",
    lastName: "Bernard",
    username: "lucas.deep",
    email: "lucas@demo.bluemates.test",
    locale: "fr",
    birthDate: new Date("1993-09-27T00:00:00.000Z"),
    bio: "Moniteur niveau 3 basé à Marseille. Passionné d’épaves, de biologie marine et de voyages légers.",
    dives: [
      ["11000000-0000-4000-8000-000000000001", "2026-07-12", "Le Chaouen, Marseille", 34.5, 49, "Tour de l’épave par bâbord, congres et dorades dans les ouvertures.", 43.2052, 5.2337, "PUBLIC"],
      ["11000000-0000-4000-8000-000000000002", "2026-05-04", "Réserve de Cabo Negro, Maroc", 22.3, 55, "Relief rocheux, poulpes et nombreux nudibranches.", 35.6754, -5.2921, "PUBLIC"],
      ["11000000-0000-4000-8000-000000000003", "2026-01-19", "Elphinstone Reef, Égypte", 38.7, 43, "Tombant sud avec requin longimane aperçu dans le bleu.", 25.3089, 34.8608, "PUBLIC"],
      ["11000000-0000-4000-8000-000000000004", "2025-11-02", "Zenobia, Chypre", 36.4, 47, "Très belle pénétration extérieure, camions encore visibles sur le pont.", 34.8843, 33.6531, "PUBLIC"],
      ["11000000-0000-4000-8000-000000000005", "2025-08-16", "Pointe Rouge, Marseille", 17.8, 61, "Exercice technique avec le club.", 43.2371, 5.3722, "PRIVATE"],
    ],
    plans: [
      ["21000000-0000-4000-8000-000000000001", 2, 21, "Scandola, Corse", "Week-end entre amis dans la réserve de Scandola, avec sortie au sec des Belges.", 42.3548, 8.5759, "PUBLIC"],
      ["21000000-0000-4000-8000-000000000002", 10, 12, "SS Thistlegorm, Égypte", "Croisière nord mer Rouge consacrée aux épaves historiques.", 27.8142, 33.9201, "PRIVATE"],
    ],
    reviews: [
      ["31000000-0000-4000-8000-000000000001", "Le Chaouen, Marseille", 43.2052, 5.2337, 5, "Une épave incontournable de Marseille lorsque la météo est calme. Très riche en poissons."],
      ["31000000-0000-4000-8000-000000000002", "Elphinstone Reef, Égypte", 25.3089, 34.8608, 4, "Superbe tombant mais courant exigeant. Site à réserver aux plongeurs à l’aise dans le bleu."],
    ],
  },
  {
    publicId: "michelle-durand",
    firstName: "Michelle",
    lastName: "Durand",
    username: "michelle.ocean",
    email: "michelle@demo.bluemates.test",
    locale: "fr",
    birthDate: new Date("1985-01-08T00:00:00.000Z"),
    bio: "Biologiste marine et plongeuse voyageuse. Je collectionne les rencontres avec les tortues, pas les souvenirs en plastique.",
    dives: [
      ["12000000-0000-4000-8000-000000000001", "2026-07-28", "Manta Point, Maldives", 18.9, 58, "Trois raies manta à la station de nettoyage, observation respectueuse à distance.", 4.1236, 73.4428, "PUBLIC"],
      ["12000000-0000-4000-8000-000000000002", "2026-04-17", "Cap des Trois Fourches, Maroc", 26.1, 51, "Gorgones, murènes et eau très claire autour du cap.", 35.4288, -2.9986, "PUBLIC"],
      ["12000000-0000-4000-8000-000000000003", "2026-02-11", "USAT Liberty, Bali", 29.4, 54, "Départ du bord avant l’aube, banc de carangues autour de l’épave.", -8.2741, 115.593, "PUBLIC"],
      ["12000000-0000-4000-8000-000000000004", "2025-12-06", "Great Barrier Reef, Australie", 21.7, 62, "Jardin de corail très coloré et deux tortues vertes.", -16.9186, 145.7781, "PUBLIC"],
      ["12000000-0000-4000-8000-000000000005", "2025-09-25", "Calanque de Méjean, Côte Bleue", 16.2, 66, "Inventaire participatif de la faune locale.", 43.3315, 5.2216, "PRIVATE"],
    ],
    plans: [
      ["22000000-0000-4000-8000-000000000001", 4, 5, "Lanzarote, îles Canaries", "Une semaine à Playa Chica pour explorer les reliefs volcaniques et le Museo Atlántico.", 28.9207, -13.6712, "PUBLIC"],
      ["22000000-0000-4000-8000-000000000002", 8, 19, "Sipadan, Malaisie", "Voyage photo consacré aux tortues, barracudas et perroquets à bosse.", 4.1148, 118.6283, "PUBLIC"],
    ],
    reviews: [
      ["32000000-0000-4000-8000-000000000001", "Manta Point, Maldives", 4.1236, 73.4428, 5, "Magique et très bien encadré. Les consignes de distance avec les mantas sont clairement respectées."],
      ["32000000-0000-4000-8000-000000000002", "USAT Liberty, Bali", -8.2741, 115.593, 5, "Accessible du bord et foisonnant de vie. Partir tôt permet d’éviter la fréquentation."],
    ],
  },
];

async function upsertFriendship(firstId, secondId) {
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: firstId, recipientId: secondId },
        { requesterId: secondId, recipientId: firstId },
      ],
    },
  });
  if (existing) {
    await prisma.friendship.update({ where: { id: existing.id }, data: { status: "ACCEPTED" } });
    return;
  }
  await prisma.friendship.create({ data: { requesterId: firstId, recipientId: secondId, status: "ACCEPTED" } });
}

async function main() {
  const passwordHash = await hash(demoPassword, 12);
  const demoEmailKeys = demoDivers.map((diver) => diver.email.toLowerCase());
  const existingMembers = await prisma.user.findMany({
    where: { emailKey: { notIn: demoEmailKeys } },
    select: { id: true, username: true },
  });
  const seededUsers = [];

  for (const diver of demoDivers) {
    const user = await prisma.user.upsert({
      where: { emailKey: diver.email.toLowerCase() },
      update: {
        publicId: diver.publicId,
        firstName: diver.firstName,
        lastName: diver.lastName,
        username: diver.username,
        usernameKey: diver.username.toLowerCase(),
        passwordHash,
        locale: diver.locale,
        birthDate: diver.birthDate,
        bio: diver.bio,
        profileVisibility: "PUBLIC",
        logbookVisibility: "PUBLIC",
      },
      create: {
        publicId: diver.publicId,
        firstName: diver.firstName,
        lastName: diver.lastName,
        username: diver.username,
        usernameKey: diver.username.toLowerCase(),
        email: diver.email,
        emailKey: diver.email.toLowerCase(),
        passwordHash,
        locale: diver.locale,
        birthDate: diver.birthDate,
        bio: diver.bio,
        profileVisibility: "PUBLIC",
        logbookVisibility: "PUBLIC",
      },
    });
    seededUsers.push(user);

    for (const [id, date, siteName, depthM, durationMinutes, details, latitude, longitude, visibility] of diver.dives) {
      const data = { userId: user.id, date: new Date(`${date}T00:00:00.000Z`), siteName, depthM, durationMinutes, details, latitude, longitude, visibility };
      await prisma.dive.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    for (const [id, months, day, siteName, details, latitude, longitude, visibility] of diver.plans) {
      const data = { userId: user.id, plannedFor: futureDate(months, day), plannedUntil: futureDate(months, day + 4), siteName, details, latitude, longitude, visibility };
      await prisma.plannedDive.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    for (const [id, siteName, latitude, longitude, rating, comment] of diver.reviews) {
      const data = { userId: user.id, siteName, latitude, longitude, rating, comment };
      await prisma.siteReview.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
  }

  for (const member of existingMembers) {
    for (const demoUser of seededUsers) await upsertFriendship(member.id, demoUser.id);
  }
  for (let first = 0; first < seededUsers.length; first += 1) {
    for (let second = first + 1; second < seededUsers.length; second += 1) {
      await upsertFriendship(seededUsers[first].id, seededUsers[second].id);
    }
  }

  console.log(JSON.stringify({
    demoUsers: seededUsers.map(({ publicId, username }) => ({ publicId, username })),
    connectedMembers: existingMembers.map(({ username }) => username),
    dives: demoDivers.reduce((total, diver) => total + diver.dives.length, 0),
    plans: demoDivers.reduce((total, diver) => total + diver.plans.length, 0),
    reviews: demoDivers.reduce((total, diver) => total + diver.reviews.length, 0),
    password: demoPassword,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
