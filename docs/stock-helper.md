# Stock helper: the only way to change stock

File: `server/src/services/stockService.js`

**Rule for everyone:** never change `Product.quantity` yourself (no `product.quantity = ...`, no `$inc` on quantity).
Call the helper. It changes the quantity, writes the stock history, and raises low-stock alerts, all in
**one database transaction**: everything is saved, or nothing is.

## The three tools

| Function | Use it for |
|---|---|
| `changeStock(options)` | Change ONE product: stock in, stock out, or adjust |
| `changeStockMany(options)` | Change SEVERAL products at once (a sale, a received purchase order). All or nothing |
| `runInTransaction(work)` | Save other things (a Sale, a PurchaseOrder status) **together** with the stock change |

### changeStock

```js
await changeStock({ productId, type: 'IN',     quantity: 20, reason: 'delivery', userId });
await changeStock({ productId, type: 'OUT',    quantity: 3,  reason: 'damaged',  userId });
await changeStock({ productId, type: 'ADJUST', newQuantity: 42, reason: 'recount', userId }); // exact count
```

Returns `{ movement, product: { id, name, sku, previousQty, newQty } }`.
Optional: `reference: { model: 'Sale' | 'PurchaseOrder', id }` links the movement to what caused it.

### changeStockMany

```js
await changeStockMany({
  items: [{ productId: a, quantity: 2 }, { productId: b, quantity: 1 }],
  type: 'OUT', reason: 'Sale INV-1', userId, reference: { model: 'Sale', id: sale._id },
});
```

### runInTransaction (with `session`)

```js
await runInTransaction(async (session) => {
  await sale.save({ session });                       // pass the session to every database call
  await changeStockMany({ items, type: 'OUT', userId, session });
});
```
If anything inside throws, **everything** (the sale, the stock change, the history, the alert) is undone.
Inside the function do database work only: MongoDB may run it again after a temporary conflict.

## What it protects you from
- **Two people taking the last item:** the "enough stock?" check happens inside the database update, so it can never go below 0.
- **Half-saved data:** a sale without its stock change, or the other way round.
- **Missing history:** every change writes a `StockMovement` with who, why, before and after.
- **Silent shortages:** crossing the reorder level creates ONE `LOW_STOCK` alert; reaching 0 creates `OUT_OF_STOCK`.

## Errors it throws (all become clean JSON responses)

| Situation | Status | Message |
|---|---|---|
| Not enough stock | 400 | `Not enough stock for Mouse. Available: 2, requested: 5` |
| Quantity not a whole number 1 or more | 400 | `Quantity must be a whole number, 1 or more` |
| Adjust to a negative or decimal number | 400 | `New quantity must be a whole number, 0 or more` |
| Adjust to the number it already is | 400 | `Stock is already at that quantity` |
| Product inactive | 400 | `Mouse is inactive` |
| Product does not exist | 404 | `Product not found` |
| Bad product id | 400 | `Invalid id` |

Convert strings from the browser first: `quantity: Number(req.body.quantity)`.

## Copy-from examples (tested end to end)
In `docs/stock-examples/`:
- `stockController.example.js`: stock in, out, adjust (Brijesh)
- `saleController.example.js`: create a sale and reduce stock together (Asmita)
- `receiveOrder.example.js`: receive a purchase order and add stock together (Shilpa)

## Check it on your own database
```
npm run check:stock
```
Creates one temporary product, tries the important cases (including 12 people taking stock at the same time
and a rollback), prints PASS or FAIL, then deletes everything it created.
