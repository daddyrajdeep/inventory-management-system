import { products as seed } from '../data/products';
import { delay } from '../utils/delay';

let list = seed.map((product) => ({ ...product }));

// Backend phase: const { data } = await api.get('/products'); return data;
export async function getProducts() {
  await delay();
  return list.map((product) => ({ ...product }));
}

// Backend phase: const { data } = await api.get(`/products/${id}`); return data;
export async function getProductById(id) {
  await delay();
  const product = list.find((item) => item.id === id);
  return product ? { ...product } : undefined;
}

// Backend phase: const { data } = await api.post('/products', payload); return data;
export async function createProduct(payload) {
  await delay();
  const sku = payload.sku.trim().toUpperCase();
  if (list.some((product) => product.sku.trim().toUpperCase() === sku)) {
    throw new Error('A product with this SKU already exists');
  }

  const product = {
    id: `p${Date.now()}`,
    name: payload.name,
    sku,
    barcode: payload.barcode ?? '',
    description: payload.description ?? '',
    category: payload.category,
    supplier: payload.supplier ?? '',
    costPrice: Number(payload.costPrice ?? 0),
    price: Number(payload.price),
    quantity: 0,
    reorderLevel: Number(payload.reorderLevel ?? 10),
    unit: payload.unit ?? 'pcs',
    rating: payload.rating ?? 0,
    isActive: payload.isActive ?? true,
  };
  list = [...list, product];
  return { ...product };
}

// Backend phase: const { data } = await api.put(`/products/${id}`, payload); return data;
export async function updateProduct(id, payload) {
  await delay();
  const current = list.find((product) => product.id === id);
  if (!current) throw new Error('Product not found');

  const sku = (payload.sku ?? current.sku).trim().toUpperCase();
  if (list.some((product) => product.id !== id && product.sku.trim().toUpperCase() === sku)) {
    throw new Error('A product with this SKU already exists');
  }

  const allowedFields = [
    'name',
    'barcode',
    'description',
    'category',
    'supplier',
    'costPrice',
    'price',
    'reorderLevel',
    'unit',
    'rating',
    'isActive',
  ];
  const changes = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedFields.includes(key))
  );
  const updated = { ...current, ...changes, sku, quantity: current.quantity };
  list = list.map((product) => (product.id === id ? updated : product));
  return { ...updated };
}

// Backend phase: await api.delete(`/products/${id}`);
export async function deleteProduct(id) {
  await delay();
  const product = list.find((item) => item.id === id);
  if (!product) throw new Error('Product not found');
  list = list.filter((item) => item.id !== id);
  return { ...product };
}
