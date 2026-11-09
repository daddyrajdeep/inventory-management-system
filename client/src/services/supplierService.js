import { suppliers } from '../data/suppliers';
import { delay } from '../utils/delay';

export async function getSuppliers() {
  await delay();
  return suppliers;
}