import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import FormField, { inputClass } from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import {
  getStock,
  getMovements,
  stockIn,
  stockOut,
  adjustStock,
} from "../services/stockService";
import { formatCurrency, formatDate } from "../utils/format";

// OWNER: Brijesh (Inventory: stock table, stock in / out / adjust)

const ACTIONS = {
  IN: { title: "Stock In", hint: "Add received stock", button: "Add stock" },
  OUT: {
    title: "Stock Out",
    hint: "Remove stock (damaged, used, returned)",
    button: "Remove stock",
  },
  ADJUST: {
    title: "Adjust Stock",
    hint: "Set the stock to the counted quantity",
    button: "Save adjustment",
  },
};

const movementTone = { IN: "green", OUT: "red", ADJUST: "blue" };

function statusOf(p) {
  if (p.quantity === 0) return "out";
  if (p.quantity <= p.reorderLevel) return "low";
  return "ok";
}

function StatusBadge({ product }) {
  const s = statusOf(product);
  if (s === "out") return <Badge tone="red">Out of stock</Badge>;
  if (s === "low") return <Badge tone="amber">Low stock</Badge>;
  return <Badge tone="green">In stock</Badge>;
}

export default function Inventory() {
  const { user } = useAuth();
  const canAdjust = user.role === "admin" || user.role === "manager";

  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [tab, setTab] = useState("stock"); // 'stock' | 'history'
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // modal state: which product + which action (IN / OUT / ADJUST)
  const [dialog, setDialog] = useState(null); // { product, type } | null
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getStock(), getMovements()])
      .then(([stock, history]) => {
        if (!active) return;
        setProducts(stock);
        setMovements(history);
      })
      .catch(() => toast.error("Could not load inventory"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const counts = useMemo(
    () => ({
      total: products.length,
      low: products.filter((p) => statusOf(p) === "low").length,
      out: products.filter((p) => statusOf(p) === "out").length,
    }),
    [products],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (statusFilter === "all" || statusOf(p) === statusFilter) &&
        (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
    );
  }, [products, query, statusFilter]);

  const openDialog = (product, type) => {
    setDialog({ product, type });
    setValue(type === "ADJUST" ? String(product.quantity) : "");
    setReason("");
    setError("");
  };

  const closeDialog = () => {
    if (!saving) setDialog(null);
  };

  const validate = () => {
    const { product, type } = dialog;
    const n = Number(value);
    if (value.trim() === "" || !Number.isInteger(n))
      return "Enter a whole number";
    if (type === "IN" && n < 1) return "Quantity must be at least 1";
    if (type === "OUT") {
      if (n < 1) return "Quantity must be at least 1";
      if (n > product.quantity) return `Only ${product.quantity} in stock`;
    }
    if (type === "ADJUST") {
      if (n < 0) return "Quantity cannot be negative";
      if (n === product.quantity)
        return "This is the same as the current stock";
      if (!reason.trim()) return "Please give a reason for the adjustment";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const { product, type } = dialog;
    const performedBy = user.email; // backend phase: the server uses the logged-in user's id
    setSaving(true);
    try {
      if (type === "IN")
        await stockIn({
          productId: product.id,
          quantity: value,
          reason,
          performedBy,
        });
      if (type === "OUT")
        await stockOut({
          productId: product.id,
          quantity: value,
          reason,
          performedBy,
        });
      if (type === "ADJUST")
        await adjustStock({
          productId: product.id,
          newQty: value,
          reason,
          performedBy,
        });
      toast.success(`${ACTIONS[type].title} saved for ${product.name}`);
      setSaving(false);
      setDialog(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setSaving(false);
      setError(err.message || "Something went wrong");
    }
  };

  const stockColumns = [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Product" },
    {
      key: "category",
      label: "Category",
      render: (r) => r.category?.name ?? r.category ?? "-", // works whether the API sends a name or a populated category
    },
    { key: "price", label: "Price", render: (r) => formatCurrency(r.price) },
    { key: "quantity", label: "In stock" },
    { key: "reorderLevel", label: "Reorder level" },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge product={r} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <button
            onClick={() => openDialog(r, "IN")}
            title="Stock in"
            aria-label={`Stock in ${r.name}`}
            className="rounded-lg p-1.5 text-green-700 hover:bg-green-50"
          >
            <ArrowDownToLine size={16} />
          </button>
          <button
            onClick={() => openDialog(r, "OUT")}
            title="Stock out"
            aria-label={`Stock out ${r.name}`}
            disabled={r.quantity === 0}
            className="rounded-lg p-1.5 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ArrowUpFromLine size={16} />
          </button>
          {canAdjust && (
            <button
              onClick={() => openDialog(r, "ADJUST")}
              title="Adjust stock"
              aria-label={`Adjust ${r.name}`}
              className="rounded-lg p-1.5 text-blue-700 hover:bg-blue-50"
            >
              <SlidersHorizontal size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const historyColumns = [
    { key: "createdAt", label: "Date", render: (r) => formatDate(r.createdAt) },
    {
      key: "productName",
      label: "Product",
      render: (r) => `${r.productName} (${r.sku})`,
    },
    {
      key: "type",
      label: "Type",
      render: (r) => <Badge tone={movementTone[r.type]}>{r.type}</Badge>,
    },
    { key: "quantity", label: "Qty" },
    {
      key: "change",
      label: "Stock change",
      render: (r) => `${r.previousQty} → ${r.newQty}`,
    },
    { key: "reason", label: "Reason", render: (r) => r.reason || "-" },
    { key: "performedBy", label: "By" },
  ];

  const action = dialog ? ACTIONS[dialog.type] : null;

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Current stock levels and stock movements"
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Products</p>
          <p className="text-xl font-semibold text-gray-900">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Low stock</p>
          <p className="text-xl font-semibold text-amber-600">{counts.low}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Out of stock</p>
          <p className="text-xl font-semibold text-red-600">{counts.out}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {[
          ["stock", "Stock levels"],
          ["history", "Stock history"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              tab === key
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {key === "history" && <History size={16} />}
            {label}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-60 flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or SKU..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="all">All stock</option>
              <option value="ok">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
          <DataTable
            columns={stockColumns}
            rows={rows}
            loading={loading}
            emptyText="No products match your search"
          />
        </>
      ) : (
        <DataTable
          columns={historyColumns}
          rows={movements}
          loading={loading}
          emptyText="No stock movements yet. Use Stock In, Stock Out or Adjust on the Stock levels tab."
        />
      )}

      <Modal
        open={!!dialog}
        title={action ? `${action.title}: ${dialog.product.name}` : ""}
        onClose={closeDialog}
      >
        {dialog && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <p className="text-sm text-gray-500">
              {action.hint}. Current stock:{" "}
              <b className="text-gray-900">{dialog.product.quantity}</b>{" "}
              {dialog.product.unit ?? "pcs"}
            </p>

            <FormField
              label={
                dialog.type === "ADJUST" ? "New counted quantity" : "Quantity"
              }
            >
              <input
                type="number"
                min={dialog.type === "ADJUST" ? 0 : 1}
                step="1"
                autoFocus
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                className={inputClass}
              />
            </FormField>

            <FormField
              label={
                dialog.type === "ADJUST"
                  ? "Reason (required)"
                  : "Reason (optional)"
              }
              error={error}
            >
              <input
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                placeholder={
                  dialog.type === "ADJUST"
                    ? "e.g. Stock take correction"
                    : "e.g. Supplier delivery"
                }
                className={inputClass}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : action.button}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
