import { products } from '../data/products';
import { delay } from '../utils/delay';

// Pages call these functions and never import dummy data directly.
// Backend phase: replace the body with  const { data } = await api.get('/products'); return data;

export async function getProducts() {
  await delay();
  return products;
}
