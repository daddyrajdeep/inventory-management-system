// Creates demo users so you can log in. Safe to run many times (existing users are skipped).
// Run:  npm run seed      (DEMO PASSWORDS: never use these on a real, deployed system)
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { User } from '../models/index.js';

const demoUsers = [
  { name: 'Admin User', email: 'admin@demo.com', password: 'Admin@123', role: 'admin' },
  { name: 'Priya Manager', email: 'priya@demo.com', password: 'Manager@123', role: 'manager' },
  { name: 'Rahul Staff', email: 'rahul@demo.com', password: 'Staff@123', role: 'staff' },
  { name: 'Sneha Staff', email: 'sneha@demo.com', password: 'Staff@123', role: 'staff', isActive: false },
];

await connectDB();

for (const data of demoUsers) {
  const exists = await User.findOne({ email: data.email });
  if (exists) {
    console.log(`skipped  ${data.email} (already exists)`);
    continue;
  }
  await User.create(data);
  console.log(`created  ${data.email}  password: ${data.password}  role: ${data.role}`);
}

await mongoose.disconnect();
console.log('Seeding finished.');
