import { PrismaClient, Role, SlotStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString:
    process.env['DATABASE_URL'] ??
    'postgresql://kite:kite@localhost:5432/kite_booking',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Location ---
  const location = await prisma.location.create({
    data: {
      name: 'El Cotillo, Fuerteventura',
      lat: 28.6825,
      lng: -14.0147,
      description:
        'Spot principale con laguna protetta per principianti e reef break per avanzati. Vento side-on costante da nord-est.',
      windMinKnots: 12,
      windMaxKnots: 35,
    },
  });

  // --- Lesson Types ---
  const lessonTypes = await Promise.all([
    prisma.lessonType.create({
      data: {
        code: 'PRIVATE_2H',
        title: 'Lezione Privata 2h',
        description:
          'Lezione individuale con istruttore dedicato, ideale per progressione rapida.',
        durationMinutes: 120,
        minParticipants: 1,
        maxParticipants: 1,
        pricePerPerson: 150,
        requiredWindKnotsMin: 12,
        requiredWindKnotsMax: 30,
        imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop',
        active: true,
      },
    }),
    prisma.lessonType.create({
      data: {
        code: 'PRIVATE_3H',
        title: 'Lezione Privata 3h',
        description:
          'Sessione estesa per lavorare su manovre specifiche con feedback continuo.',
        durationMinutes: 180,
        minParticipants: 1,
        maxParticipants: 1,
        pricePerPerson: 210,
        requiredWindKnotsMin: 12,
        requiredWindKnotsMax: 30,
        imageUrl: 'https://images.unsplash.com/photo-1622397086422-5765e8c1c985?w=600&h=400&fit=crop',
        active: true,
      },
    }),
    prisma.lessonType.create({
      data: {
        code: 'SEMIPRIVATE_3H',
        title: 'Lezione Semi-Privata 3h',
        description:
          'Lezione per 2 persone dello stesso livello, ottimo rapporto qualità-prezzo.',
        durationMinutes: 180,
        minParticipants: 2,
        maxParticipants: 2,
        pricePerPerson: 140,
        requiredWindKnotsMin: 12,
        requiredWindKnotsMax: 30,
        active: true,
      },
    }),
    prisma.lessonType.create({
      data: {
        code: 'BEGINNER_COURSE_6H',
        title: 'Corso Principianti 6h',
        description:
          'Corso completo da zero: sicurezza, body drag, water start e prime bolinate.',
        durationMinutes: 360,
        minParticipants: 1,
        maxParticipants: 2,
        pricePerPerson: 350,
        requiredWindKnotsMin: 12,
        requiredWindKnotsMax: 30,
        imageUrl: 'https://images.unsplash.com/photo-1590579491624-f98f36d4c763?w=600&h=400&fit=crop',
        active: true,
      },
    }),
    prisma.lessonType.create({
      data: {
        code: 'REFRESH_2H',
        title: 'Refresh Session 2h',
        description:
          'Ripasso per chi non pratica da tempo, focus su sicurezza e water start.',
        durationMinutes: 120,
        minParticipants: 1,
        maxParticipants: 1,
        pricePerPerson: 130,
        requiredWindKnotsMin: 15,
        requiredWindKnotsMax: 35,
        active: true,
      },
    }),
  ]);

  const ltMap = Object.fromEntries(lessonTypes.map((lt) => [lt.code, lt]));

  // --- Users: Instructors ---
  const instructorUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'marco.rossi@kamikite.com',
        name: 'Marco Rossi',
        role: Role.INSTRUCTOR,
      },
    }),
    prisma.user.create({
      data: {
        email: 'laura.fernandez@kamikite.com',
        name: 'Laura Fernández',
        role: Role.INSTRUCTOR,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jan.kowalski@kamikite.com',
        name: 'Jan Kowalski',
        role: Role.INSTRUCTOR,
      },
    }),
  ]);

  const instructors = await Promise.all([
    prisma.instructor.create({
      data: {
        userId: instructorUsers[0].id,
        bio: 'Istruttore IKO Level 3 con 8 anni di esperienza. Specializzato in freestyle e wave riding.',
        certifications: ['IKO Level 3', 'First Aid', 'VHF Radio'],
        colorHex: '#2563EB',
        active: true,
      },
    }),
    prisma.instructor.create({
      data: {
        userId: instructorUsers[1].id,
        bio: 'Ex campionessa regionale, istruttrice IKO Level 2. Paziente e attenta alla sicurezza.',
        certifications: ['IKO Level 2', 'First Aid'],
        colorHex: '#DC2626',
        active: true,
      },
    }),
    prisma.instructor.create({
      data: {
        userId: instructorUsers[2].id,
        bio: 'Kiter da 12 anni, istruttore IKO Level 2. Esperto di foil e light wind.',
        certifications: ['IKO Level 2', 'Hydrofoil Instructor', 'First Aid'],
        colorHex: '#16A34A',
        active: true,
      },
    }),
  ]);

  // --- Admin ---
  await prisma.user.create({
    data: {
      email: 'admin@demo.local',
      name: 'Admin Kami',
      role: Role.ADMIN,
    },
  });

  // --- Customers ---
  const customers = await Promise.all(
    [
      { email: 'sofia.bianchi@gmail.com', name: 'Sofia Bianchi' },
      { email: 'thomas.mueller@web.de', name: 'Thomas Müller' },
      { email: 'emma.dupont@outlook.fr', name: 'Emma Dupont' },
      { email: 'carlos.garcia@yahoo.es', name: 'Carlos García' },
      { email: 'anna.svensson@gmail.com', name: 'Anna Svensson' },
    ].map((c) => prisma.user.create({ data: { ...c, role: Role.CUSTOMER } }))
  );

  // --- Slots (30, next 14 days) ---
  const now = new Date();
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0
  );
  const slotHours = [9, 11, 14, 16];
  const ltCodes = [
    'PRIVATE_2H',
    'PRIVATE_3H',
    'SEMIPRIVATE_3H',
    'BEGINNER_COURSE_6H',
    'REFRESH_2H',
  ];

  const slots = [];
  for (let i = 0; i < 30; i++) {
    const dayOffset = Math.floor(i / 2.2);
    const hour = slotHours[i % slotHours.length];
    const startsAt = new Date(startOfTomorrow);
    startsAt.setDate(startsAt.getDate() + dayOffset);
    startsAt.setHours(hour, 0, 0, 0);

    const ltCode = ltCodes[i % ltCodes.length];
    const lt = ltMap[ltCode];
    const endsAt = new Date(startsAt.getTime() + lt.durationMinutes * 60_000);
    const instructor = instructors[i % instructors.length];

    let status: SlotStatus;
    if (i % 10 < 7) status = SlotStatus.AVAILABLE;
    else if (i % 10 < 9) status = SlotStatus.PENDING;
    else status = SlotStatus.CONFIRMED;

    slots.push(
      await prisma.slot.create({
        data: {
          instructorId: instructor.id,
          locationId: location.id,
          lessonTypeId: lt.id,
          startsAt,
          endsAt,
          status,
          maxStudents: lt.maxParticipants,
        },
      })
    );
  }

  // --- Bookings (5, on PENDING/CONFIRMED slots) ---
  const bookableSlots = slots.filter(
    (s) =>
      s.status === SlotStatus.PENDING || s.status === SlotStatus.CONFIRMED
  );

  for (let i = 0; i < Math.min(5, bookableSlots.length); i++) {
    const slot = bookableSlots[i];
    const customer = customers[i % customers.length];
    const lt = lessonTypes.find((l) => l.id === slot.lessonTypeId)!;
    const total = Number(lt.pricePerPerson);
    const deposit = Math.round(total * 0.3 * 100) / 100;

    const booking = await prisma.booking.create({
      data: {
        slotId: slot.id,
        userId: customer.id,
        status: slot.status,
        depositAmount: deposit,
        totalAmount: total,
        notes:
          i === 0
            ? "Prima esperienza, un po' nervosa per il vento forte"
            : null,
      },
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: 'AVAILABLE',
        toStatus: slot.status,
        reason: 'Prenotazione creata dal seed',
        changedBy: 'SYSTEM',
      },
    });
  }

  console.log('✅ Seed completato con successo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
