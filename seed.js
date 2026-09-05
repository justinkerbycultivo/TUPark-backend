// Run with: npm run seed
// Populates the database with sample TUP campus parking spots.
require('dotenv').config();
const connectDB = require('./config/db');
const ParkingSpot = require('./models/ParkingSpot');

const sampleSpots = [
  { spotNumber: 'A1', section: 'Building A - Ground Floor', type: 'regular', pricePerHour: 20 },
  { spotNumber: 'A2', section: 'Building A - Ground Floor', type: 'regular', pricePerHour: 20 },
  { spotNumber: 'A3', section: 'Building A - Ground Floor', type: 'disabled', pricePerHour: 20 },
  { spotNumber: 'B1', section: 'Building B - Basement', type: 'regular', pricePerHour: 20 },
  { spotNumber: 'B2', section: 'Building B - Basement', type: 'regular', pricePerHour: 20 },
  { spotNumber: 'B3', section: 'Building B - Basement', type: 'motorcycle', pricePerHour: 10 },
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
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    process.exit();
  }
})();
