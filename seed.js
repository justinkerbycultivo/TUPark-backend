// Run with: npm run seed
// Populates the database with sample TUP campus parking spots
// and a test guard account for scanning students in.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const ParkingSpot = require('./models/ParkingSpot');
const User = require('./models/User');

const sampleSpots = [
  { spotNumber: 'A1', section: 'Building A - Ground Floor', type: 'regular', pricePerHour: 20 },
  { spotNumber: 'A2', section: 'Building A - Ground Floor', type: 'regular', pricePerHour: 20 },
  { spotNumber: 'A3', section: 'Building A - Ground Floor', type: 'disabled', pricePerHour: 20 },
  { spotNumber: 'B1', section: 'Building B - Basement', type: 'regular', pricePerHour: 20 },
  { spotNumber: 'B2', section: 'Building B - Basement', type: 'regular', pricePerHour: 20 },
  { spotNumber: 'B3', section: 'Building B - Basement', type: 'motorcycle', pricePerHour: 10 },
  { spotNumber: 'B4', section: 'Building B - Basement', type: 'motorcycle', pricePerHour: 10 },
  { spotNumber: 'C1', section: 'Gymnasium Lot', type: 'regular', pricePerHour: 15 },
  { spotNumber: 'C2', section: 'Gymnasium Lot', type: 'motorcycle', pricePerHour: 10 },
  { spotNumber: 'D1', section: 'Main Gate Lot', type: 'regular', pricePerHour: 25 },
  { spotNumber: 'D2', section: 'Main Gate Lot', type: 'regular', pricePerHour: 25 },
];

(async () => {
  try {
    await connectDB();

    await ParkingSpot.deleteMany({});
    await ParkingSpot.insertMany(sampleSpots);
    console.log(`Seeded ${sampleSpots.length} parking spots.`);

    // Test guard account so you can log in and try the QR scanner
    // without registering a real guard through the app (there's no
    // guard sign-up screen — guard/admin accounts are created here).
    const guardEmail = 'guard@tup.edu.ph';
    await User.deleteOne({ email: guardEmail });
    const passwordHash = await bcrypt.hash('guard123', 10);
    await User.create({
      fullName: 'Campus Guard',
      studentId: 'GUARD-0001',
      email: guardEmail,
      contactNumber: '09000000000',
      passwordHash,
      role: 'guard',
      vehicle: { plateNumber: 'GUARD-N/A', vehicleType: 'car' },
    });
    console.log(`Seeded guard account -> email: ${guardEmail} / password: guard123`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    process.exit();
  }
})();
