import { categories } from '../data/categories';
import { delay } from '../utils/delay';

export async function getCategories() {
  await delay();
  return categories;
}