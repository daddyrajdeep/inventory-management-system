import { Sale, Expense, Product } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { TZ, getRange, previousRange, eachDay } from '../utils/dateRange.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// % change from previous to current. null when there is nothing to compare with (previous was 0).
const percentChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
};

const inRange = (field, { start, end }) => ({ [field]: { $gte: start, $lt: end } });

// Total money + count for one period
async function salesTotal(range) {
  const [row] = await Sale.aggregate([
    { $match: inRange('createdAt', range) },
    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
  ]);
  return { total: row?.total ?? 0, count: row?.count ?? 0 };
}

async function expensesTotal(range) {
  const [row] = await Expense.aggregate([
    { $match: inRange('date', range) },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return { total: row?.total ?? 0, count: row?.count ?? 0 };
}

// GET /api/reports/summary?days=30   (or ?from=YYYY-MM-DD&to=YYYY-MM-DD)
// The four dashboard cards + the stock-health donut
export const getSummary = asyncHandler(async (req, res) => {
  const range = getRange(req.query);
  const prev = previousRange(range);

  const [sales, prevSales, expenses, prevExpenses, [stock]] = await Promise.all([
    salesTotal(range),
    salesTotal(prev),
    expensesTotal(range),
    expensesTotal(prev),
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalUnits: { $sum: '$quantity' },
          stockValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } },
          lowStock: {
            $sum: { $cond: [{ $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$reorderLevel'] }] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const totalProducts = stock?.totalProducts ?? 0;
  const outOfStock = stock?.outOfStock ?? 0;
  const lowStock = stock?.lowStock ?? 0;
  const netProfit = sales.total - expenses.total;
  const prevNetProfit = prevSales.total - prevExpenses.total;

  res.json({
    range: { from: range.start, to: range.end },
    sales: { total: round2(sales.total), count: sales.count, change: percentChange(sales.total, prevSales.total) },
    expenses: { total: round2(expenses.total), count: expenses.count, change: percentChange(expenses.total, prevExpenses.total) },
    netProfit: { total: round2(netProfit), change: percentChange(netProfit, prevNetProfit) },
    inventory: {
      totalProducts,
      totalUnits: stock?.totalUnits ?? 0,
      stockValue: round2(stock?.stockValue ?? 0), // quantity x cost price
      inStock: totalProducts - lowStock - outOfStock,
      lowStock,
      outOfStock,
    },
  });
});

// GET /api/reports/top-products?limit=5&sortBy=revenue|quantity&days=30
export const getTopProducts = asyncHandler(async (req, res) => {
  const range = getRange(req.query);
  const limit = Number(req.query.limit) || 5;
  const sortField = req.query.sortBy === 'quantity' ? 'unitsSold' : 'revenue';

  const rows = await Sale.aggregate([
    { $match: inRange('createdAt', range) },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $last: '$items.name' }, // name saved on the sale, still right if the product was renamed
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' }, // before the invoice-level discount
      },
    },
    { $sort: { [sortField]: -1, _id: 1 } },
    { $limit: limit },
    { $lookup: { from: Product.collection.name, localField: '_id', foreignField: '_id', as: 'product' } },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: 1,
        sku: { $arrayElemAt: ['$product.sku', 0] },
        unitsSold: 1,
        revenue: 1,
        stockLeft: { $arrayElemAt: ['$product.quantity', 0] },
      },
    },
  ]);

  res.json(rows.map((r) => ({ ...r, revenue: round2(r.revenue) })));
});

// GET /api/reports/sales-by-day?days=30
// One row per day (days with no sales come back as 0, so the chart line has no gaps)
export const getSalesByDay = asyncHandler(async (req, res) => {
  const range = getRange(req.query);

  const rows = await Sale.aggregate([
    { $match: inRange('createdAt', range) },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } },
        sales: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
  ]);

  const byDate = new Map(rows.map((r) => [r._id, r]));
  res.json(
    eachDay(range).map((date) => ({
      date,
      sales: round2(byDate.get(date)?.sales ?? 0),
      orders: byDate.get(date)?.orders ?? 0,
    }))
  );
});

// GET /api/reports/expense-by-category?days=30
export const getExpenseByCategory = asyncHandler(async (req, res) => {
  const range = getRange(req.query);

  const rows = await Expense.aggregate([
    { $match: inRange('date', range) },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  res.json({
    total: round2(grandTotal),
    categories: rows.map((r) => ({
      category: r._id,
      total: round2(r.total),
      count: r.count,
      percentage: grandTotal ? Math.round((r.total / grandTotal) * 1000) / 10 : 0,
    })),
  });
});
