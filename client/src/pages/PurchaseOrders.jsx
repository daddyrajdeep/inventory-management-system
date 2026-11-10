import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Plus, Send, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import FormField, { inputClass } from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { getProducts } from "../services/productService";
import {
  getOrders,
  getSuppliers,
  createOrder,
  updateOrderStatus,
  receiveOrder,
} from "../services/orderService";
import { formatCurrency, formatDate } from "../utils/format";

// OWNER: Shilpa (Purchase Orders: list, create order, mark received)

const statusTone = {
  draft: "gray",
  ordered: "blue",
  received: "green",
  cancelled: "red",
};
const emptyItem = () => ({ product: "", quantity: "", unitCost: "" });
const emptyForm = () => ({
  supplier: "",
  expectedDate: "",
  notes: "",
  items: [emptyItem()],
});

export default function PurchaseOrders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getOrders(), getSuppliers(), getProducts()])
      .then(([o, s, p]) => {
        if (!active) return;
        setOrders(o);
        setSuppliers(s);
        setProducts(p);
      })
      .catch(() => toast.error("Could not load purchase orders"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const rows = useMemo(
    () =>
      statusFilter === "all"
        ? orders
        : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter],
  );

  const formTotal = form.items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0),
    0,
  );

  // ---------- create form ----------
  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (!saving) setCreateOpen(false);
  };

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setItem = (index, key, value) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) =>
        i === index ? { ...it, [key]: value } : it,
      ),
    }));
    setErrors((e) => ({ ...e, items: undefined }));
  };

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (index) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const validate = () => {
    const e = {};
    if (!form.supplier) e.supplier = "Choose a supplier";
    if (form.items.length === 0) {
      e.items = "Add at least one item";
    } else {
      const picked = form.items.map((i) => i.product);
      for (const it of form.items) {
        const qty = Number(it.quantity);
        const cost = Number(it.unitCost);
        if (!it.product) e.items = "Choose a product for every row";
        else if (picked.filter((p) => p === it.product).length > 1)
          e.items = "Each product can appear only once";
        else if (it.quantity === "" || !Number.isInteger(qty) || qty < 1)
          e.items = "Quantity must be a whole number of at least 1";
        else if (it.unitCost === "" || Number.isNaN(cost) || cost < 0)
          e.items = "Unit cost must be 0 or more";
        if (e.items) break;
      }
    }
    return e;
  };

  const handleCreate = async (status) => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      const order = await createOrder({
        ...form,
        status,
        createdBy: user.email,
      });
      toast.success(
        `${order.orderNumber} ${status === "ordered" ? "placed" : "saved as draft"}`,
      );
      setSaving(false);
      setCreateOpen(false);
      refresh();
    } catch (err) {
      setSaving(false);
      toast.error(err.message || "Could not create the order");
    }
  };

  // ---------- row actions ----------
  const runAction = async (order, fn, successText) => {
    setBusyId(order.id);
    try {
      await fn();
      toast.success(successText);
      setViewing(null);
      refresh();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  const handlePlace = (o) =>
    runAction(
      o,
      () => updateOrderStatus(o.id, "ordered"),
      `${o.orderNumber} placed`,
    );

  const handleCancel = (o) => {
    if (!window.confirm(`Cancel ${o.orderNumber}?`)) return;
    runAction(
      o,
      () => updateOrderStatus(o.id, "cancelled"),
      `${o.orderNumber} cancelled`,
    );
  };

  const handleReceive = (o) => {
    if (
      !window.confirm(
        `Mark ${o.orderNumber} as received? This adds the items to your stock.`,
      )
    )
      return;
    runAction(
      o,
      () => receiveOrder(o.id, user.email),
      `${o.orderNumber} received, stock updated`,
    );
  };

  const actionButtons = (o) => (
    <div className="flex flex-wrap gap-1">
      <button
        onClick={() => setViewing(o)}
        title="View"
        aria-label={`View ${o.orderNumber}`}
        className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
      >
        <Eye size={16} />
      </button>
      {o.status === "draft" && (
        <button
          onClick={() => handlePlace(o)}
          disabled={busyId === o.id}
          title="Place order"
          aria-label={`Place ${o.orderNumber}`}
          className="rounded-lg p-1.5 text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      )}
      {o.status === "ordered" && (
        <button
          onClick={() => handleReceive(o)}
          disabled={busyId === o.id}
          title="Mark received"
          aria-label={`Mark ${o.orderNumber} received`}
          className="rounded-lg p-1.5 text-green-700 hover:bg-green-50 disabled:opacity-40"
        >
          <CheckCircle2 size={16} />
        </button>
      )}
      {(o.status === "draft" || o.status === "ordered") && (
        <button
          onClick={() => handleCancel(o)}
          disabled={busyId === o.id}
          title="Cancel order"
          aria-label={`Cancel ${o.orderNumber}`}
          className="rounded-lg p-1.5 text-red-700 hover:bg-red-50 disabled:opacity-40"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );

  const columns = [
    { key: "orderNumber", label: "Order #" },
    { key: "supplierName", label: "Supplier" },
    { key: "items", label: "Items", render: (r) => r.items.length },
    {
      key: "totalAmount",
      label: "Total",
      render: (r) => formatCurrency(r.totalAmount),
    },
    {
      key: "expectedDate",
      label: "Expected",
      render: (r) => (r.expectedDate ? formatDate(r.expectedDate) : "-"),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge>,
    },
    { key: "actions", label: "Actions", render: actionButtons },
  ];

  return (
    <>
      <PageHeader
        title="Purchase Orders"
        subtitle="Order stock from suppliers"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Create Order
          </button>
        }
      />

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="all">All orders</option>
          <option value="draft">Draft</option>
          <option value="ordered">Ordered</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No purchase orders found"
      />

      {/* Create order */}
      <Modal
        open={createOpen}
        title="Create Purchase Order"
        onClose={closeCreate}
      >
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <FormField label="Supplier" error={errors.supplier}>
            <select
              value={form.supplier}
              onChange={(e) => setField("supplier", e.target.value)}
              className={inputClass}
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Expected delivery date">
            <input
              type="date"
              value={form.expectedDate}
              onChange={(e) => setField("expectedDate", e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Items" error={errors.items}>
            <div className="space-y-2">
              {form.items.map((it, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-2"
                >
                  <select
                    value={it.product}
                    onChange={(e) => setItem(index, "product", e.target.value)}
                    aria-label="Product"
                    className={inputClass}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={it.quantity}
                      onChange={(e) =>
                        setItem(index, "quantity", e.target.value)
                      }
                      placeholder="Qty"
                      aria-label="Quantity"
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.unitCost}
                      onChange={(e) =>
                        setItem(index, "unitCost", e.target.value)
                      }
                      placeholder="Unit cost"
                      aria-label="Unit cost"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                + Add another item
              </button>
            </div>
          </FormField>

          <FormField label="Notes (optional)">
            <input
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className={inputClass}
            />
          </FormField>

          <p className="text-sm text-gray-600">
            Order total:{" "}
            <b className="text-gray-900">{formatCurrency(formTotal)}</b>
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={closeCreate}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleCreate("draft")}
            className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleCreate("ordered")}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Place order"}
          </button>
        </div>
      </Modal>

      {/* View order */}
      <Modal
        open={!!viewing}
        title={viewing ? viewing.orderNumber : ""}
        onClose={() => setViewing(null)}
      >
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{viewing.supplierName}</span>
              <Badge tone={statusTone[viewing.status]}>{viewing.status}</Badge>
            </div>
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {viewing.items.map((i) => (
                <div
                  key={i.product}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-gray-900">{i.productName}</p>
                    <p className="text-xs text-gray-500">
                      {i.sku} · {i.quantity} × {formatCurrency(i.unitCost)}
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(i.quantity * i.unitCost)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-right font-semibold text-gray-900">
              Total: {formatCurrency(viewing.totalAmount)}
            </p>
            <p className="text-xs text-gray-500">
              Expected:{" "}
              {viewing.expectedDate ? formatDate(viewing.expectedDate) : "-"}
              {viewing.receivedDate &&
                ` · Received: ${formatDate(viewing.receivedDate)}`}
            </p>
            {viewing.notes && (
              <p className="text-xs text-gray-500">Notes: {viewing.notes}</p>
            )}
            <div className="pt-1">{actionButtons(viewing)}</div>
          </div>
        )}
      </Modal>
    </>
  );
}
