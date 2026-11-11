# Backend example: Categories

A complete, tested backend module to copy from. Use it as the pattern for your own module.

1. `categoryController.js` -> copy to `server/src/controllers/`
2. `categoryRoutes.js`     -> copy to `server/src/routes/`
3. Register it in `server/src/routes/index.js`:
   ```js
   import categoryRoutes from './categoryRoutes.js';
   router.use('/categories', categoryRoutes);
   ```
4. `categoryService.example.js` shows how the frontend service calls it.

To build YOUR module, copy these files, then rename: Category -> Supplier (or Product, Expense...),
adjust the model fields, the validation rules, and who is allowed (authorize).
