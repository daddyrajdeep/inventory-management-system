import { sales } from '../data/sales';
import { delay } from '../utils/delay';

// Backend phase: await api.get('/sales')
export async function getSales() {
  await delay();
  return sales;
}
