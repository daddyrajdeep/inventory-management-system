import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  FileText,
  Users,
  TrendingUp,
  Download,
  Plus,
  Search,
  Eye,
  Banknote,
  Smartphone,
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Loader2,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import "./Sales.css";
import { useAuth } from "../context/AuthContext";
import { getSales, getSaleById, createSale } from "../services/saleService";
import { getProducts } from "../services/productService";
import { getTopProducts, getSalesByDay } from "../services/reportService";
import { downloadCsv } from "../utils/csv";

const money = (value) =>
  "₹ " + Number(value || 0).toLocaleString("en-IN");

const units = (n) => `${n} ${n === 1 ? "unit" : "units"}`;

const PAYMENT_METHODS = {
  cash: { label: "Cash", Icon: Banknote },
  upi: { label: "UPI", Icon: Smartphone },
  card: { label: "Card", Icon: CreditCard },
};

function PaymentBadge({ method }) {
  const { label, Icon } = PAYMENT_METHODS[method] || { label: method, Icon: Banknote };

  return (
    <span className={`sales-status ${method}`}>
      <Icon size={13} />
      {label}
    </span>
  );
}

export default function Sales() {
  const { user } = useAuth();
  const canViewReports = user?.role === "admin" || user?.role === "manager";

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [reportsError, setReportsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All Payments");
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetail, setSaleDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    productId: "",
    quantity: 1,
    discount: 0,
    paymentMethod: "cash",
  });

  const pageSize = 10;

  const loadReports = useCallback(() => {
    Promise.all([
      getTopProducts({ limit: 4, sortBy: "quantity", days: 30 }),
      getSalesByDay({ days: 6 }),
    ])
      .then(([top, trend]) => {
        setTopProducts(top || []);
        setSalesTrend(trend || []);
        setReportsError(false);
      })
      .catch(() => setReportsError(true));
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [salesData, prodData] = await Promise.all([getSales(), getProducts()]);
        setSales(salesData || []);
        setProducts(prodData || []);
      } catch (err) {
        toast.error(err.message || "Failed to load sales data");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
    if (canViewReports) loadReports();
  }, [canViewReports, loadReports]);

  const filteredSales = useMemo(() => {
    const term = search.toLowerCase();
    return sales.filter((sale) => {
      const matchesSearch =
        sale.invoiceNumber.toLowerCase().includes(term) ||
        sale.customerName.toLowerCase().includes(term);

      const matchesPayment =
        paymentFilter === "All Payments" || sale.paymentMethod === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [sales, search, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleSales = filteredSales.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalSalesAmount = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

  const uniqueCustomers = new Set(
    sales.map((s) => s.customerName).filter((name) => name && !/^walk-in/i.test(name))
  ).size;

  const maxTrendSales = Math.max(0, ...salesTrend.map((d) => d.sales || 0));
  const maxUnitsSold = Math.max(0, ...topProducts.map((p) => p.unitsSold || 0));

  const openSaleDetail = async (sale) => {
    setSelectedSale(sale);
    setSaleDetail(null);
    setModal("view");
    try {
      setDetailLoading(true);
      setSaleDetail(await getSaleById(sale.id));
    } catch (err) {
      toast.error(err.message || "Failed to load sale details");
    } finally {
      setDetailLoading(false);
    }
  };

  const openNewSale = () => {
    setSelectedSale(null);
    setForm({
      customerName: "",
      productId: products.find((p) => p.quantity > 0)?.id || "",
      quantity: 1,
      discount: 0,
      paymentMethod: "cash",
    });
    setModal("add");
  };

  const selectedProduct = products.find((p) => p.id === form.productId);
  const calculatedGross = selectedProduct ? selectedProduct.price * form.quantity : 0;
  const calculatedTotal = Math.max(0, calculatedGross - (Number(form.discount) || 0));

  const handleSaveSale = async (e) => {
    e.preventDefault();
    if (!form.productId) {
      toast.error("Please select a product");
      return;
    }
    if (form.quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      setSubmitting(true);
      const newSale = await createSale({
        items: [{ product: form.productId, quantity: Number(form.quantity) }],
        customerName: form.customerName.trim(),
        paymentMethod: form.paymentMethod,
        discount: Number(form.discount) || 0,
      });

      setSales((prev) => [newSale, ...prev]);
      toast.success(`Sale created: ${newSale.invoiceNumber}`);
      setModal("");
      setPage(1);

      // Refresh product stock and reports
      const updatedProducts = await getProducts();
      setProducts(updatedProducts || []);
      if (canViewReports) loadReports();
    } catch (err) {
      toast.error(err.message || "Failed to create sale");
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Invoice", "Customer", "Units", "Amount", "Payment", "Date"];
    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      s.customerName,
      s.itemCount,
      s.totalAmount,
      PAYMENT_METHODS[s.paymentMethod]?.label || s.paymentMethod,
      new Date(s.createdAt).toLocaleDateString(),
    ]);

    downloadCsv("stockflow-sales.csv", [headers, ...rows]);
  };

  const stats = [
    {
      title: "Total Sales",
      value: money(totalSalesAmount),
      note: "Revenue across listed sales",
      Icon: ShoppingCart,
      color: "purple",
    },
    {
      title: "Total Orders",
      value: sales.length,
      note: "Invoices recorded",
      Icon: FileText,
      color: "blue",
    },
    {
      title: "Total Customers",
      value: uniqueCustomers,
      note: "Named customers, excl. walk-in",
      Icon: Users,
      color: "green",
    },
    {
      title: "Average Order",
      value: money(sales.length ? Math.round(totalSalesAmount / sales.length) : 0),
      note: "Total sales ÷ orders",
      Icon: TrendingUp,
      color: "amber",
    },
  ];

  const detail = saleDetail && saleDetail.id === selectedSale?.id ? saleDetail : null;
  const emptyMessage = sales.length === 0 ? "No sales yet" : "No sales match your filters.";

  return (
    <div className="sales-page">
      <div className="sales-breadcrumb">
        Dashboard <span>›</span> Sales
      </div>

      {/* Page heading */}
      <div className="sales-heading">
        <div className="sales-heading-title">
          <div className="sales-heading-icon">
            <ShoppingCart size={25} />
          </div>
          <div>
            <h1>Sales</h1>
            <p>Manage sales transactions, invoices and stock deductions.</p>
          </div>
        </div>

        <div className="sales-heading-actions">
          <button className="sales-outline-btn" onClick={exportCSV}>
            <Download size={16} /> Export
          </button>
          <button className="sales-primary-btn" onClick={openNewSale}>
            <Plus size={18} /> New Sale
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="sales-metrics">
        {stats.map(({ title, value, note, Icon, color }) => (
          <div className={`sales-metric ${color}`} key={title}>
            <div className="sales-metric-icon">
              <Icon size={23} />
            </div>
            <div>
              <span>{title}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics */}
      <div className="sales-analytics">
        <section className="sales-chart-card">
          <div className="sales-card-heading">
            <div>
              <h3>Recent Sales Velocity</h3>
              <p>Daily sales, last 6 days</p>
            </div>
          </div>

          {!canViewReports ? (
            <p className="sales-empty">Reports are available to managers and admins.</p>
          ) : reportsError ? (
            <p className="sales-empty">Couldn't load sales trend.</p>
          ) : maxTrendSales === 0 ? (
            <p className="sales-empty">No sales yet</p>
          ) : (
            <div className="sales-chart">
              <div className="sales-chart-plot" style={{ marginLeft: 0 }}>
                <div className="sales-bars">
                  {salesTrend.map((item) => (
                    <div className="sales-bar-column" key={item.date}>
                      <div
                        className={`sales-bar${item.sales > 0 ? "" : " zero"}`}
                        style={{ height: `${((item.sales || 0) / maxTrendSales) * 100}%` }}
                        title={`${item.date}: ${money(item.sales)}`}
                      />
                      <span>{item.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="sales-top-card">
          <div className="sales-card-heading">
            <div>
              <h3>Top Selling Products</h3>
              <p>By units sold, last 30 days</p>
            </div>
          </div>

          {!canViewReports ? (
            <p className="sales-empty">Reports are available to managers and admins.</p>
          ) : reportsError ? (
            <p className="sales-empty">Couldn't load top products.</p>
          ) : topProducts.length === 0 ? (
            <p className="sales-empty">No sales yet</p>
          ) : (
            <div className="sales-product-list">
              {topProducts.map((prod) => (
                <div className="sales-product" key={prod.productId}>
                  <div className="sales-product-symbol">
                    <Package size={20} />
                  </div>
                  <div className="sales-product-info">
                    <strong>{prod.name}</strong>
                    <div className="sales-product-track">
                      <i style={{ width: `${maxUnitsSold ? (prod.unitsSold / maxUnitsSold) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span>{units(prod.unitsSold)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sales transactions */}
      <section className="sales-panel">
        <div className="sales-table-heading">
          <div>
            <h3>Sales Transactions</h3>
            <p>Invoices recorded, newest first.</p>
          </div>
          <button className="sales-primary-btn" onClick={openNewSale}>
            <Plus size={17} /> New Sale
          </button>
        </div>

        <div className="sales-toolbar">
          <label className="sales-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice or customer..."
            />
          </label>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
          >
            <option>All Payments</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>

          <div className="sales-view-toggle">
            <button
              className={view === "list" ? "selected" : ""}
              onClick={() => setView("list")}
              title="List view"
            >
              <List size={18} />
            </button>
            <button
              className={view === "grid" ? "selected" : ""}
              onClick={() => setView("grid")}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--s-muted)" }}>
            <Loader2 className="animate-spin" size={24} style={{ display: "inline-block", marginRight: "8px" }} />
            Loading sales...
          </div>
        ) : view === "list" ? (
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Units</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleSales.map((sale, index) => (
                  <tr key={sale.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td><span className="sales-invoice">{sale.invoiceNumber}</span></td>
                    <td><strong>{sale.customerName}</strong></td>
                    <td>{units(sale.itemCount)}</td>
                    <td><strong>{money(sale.totalAmount)}</strong></td>
                    <td><PaymentBadge method={sale.paymentMethod} /></td>
                    <td>
                      {new Date(sale.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="sales-row-actions">
                        <button title="View Details" onClick={() => openSaleDetail(sale)}>
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {visibleSales.length === 0 && (
                  <tr>
                    <td colSpan="8" className="sales-empty">
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sales-grid">
            {visibleSales.map((sale) => (
              <article className="sales-transaction-card" key={sale.id}>
                <div className="sales-transaction-top">
                  <span className="sales-invoice">{sale.invoiceNumber}</span>
                  <PaymentBadge method={sale.paymentMethod} />
                </div>
                <h4>{sale.customerName}</h4>
                <p>
                  {new Date(sale.createdAt).toLocaleDateString()} · {units(sale.itemCount)}
                </p>
                <strong className="sales-transaction-amount">
                  {money(sale.totalAmount)}
                </strong>
                <div className="sales-row-actions">
                  <button onClick={() => openSaleDetail(sale)}>
                    <Eye size={16} /> View
                  </button>
                </div>
              </article>
            ))}
            {visibleSales.length === 0 && (
              <p className="sales-empty">{emptyMessage}</p>
            )}
          </div>
        )}

        <div className="sales-footer">
          <span>
            Showing {filteredSales.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {" – "}
            {Math.min(currentPage * pageSize, filteredSales.length)}
            {" of "}{filteredSales.length} transactions
          </span>

          <div className="sales-pagination">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft size={17} />
            </button>
            <span>{currentPage}</span>
            <small>of {totalPages}</small>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Add / View modal */}
      {modal && (
        <div className="sales-modal-backdrop" onClick={() => setModal("")}>
          <div className="sales-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sales-modal-close" onClick={() => setModal("")}>
              <X size={17} />
            </button>

            {modal === "view" ? (
              <>
                <h2>Sale Details</h2>
                <p>{units(selectedSale.itemCount)} across {selectedSale.lineCount} {selectedSale.lineCount === 1 ? "product" : "products"}.</p>
                <div className="sales-detail-list">
                  <span>Invoice</span><strong>{selectedSale.invoiceNumber}</strong>
                  <span>Customer</span><strong>{selectedSale.customerName}</strong>
                  <span>Discount</span><strong>{money(selectedSale.discount)}</strong>
                  <span>Amount</span><strong>{money(selectedSale.totalAmount)}</strong>
                  <span>Payment Method</span><strong>{PAYMENT_METHODS[selectedSale.paymentMethod]?.label || selectedSale.paymentMethod}</strong>
                  <span>Sold By</span><strong>{selectedSale.soldBy || "—"}</strong>
                  <span>Date</span>
                  <strong>{new Date(selectedSale.createdAt).toLocaleString()}</strong>
                </div>

                <div className="sales-items-wrap">
                  {detailLoading ? (
                    <p className="sales-empty">
                      <Loader2 className="animate-spin" size={16} style={{ display: "inline-block", marginRight: "6px" }} />
                      Loading items...
                    </p>
                  ) : detail ? (
                    <table className="sales-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item, idx) => (
                          <tr key={`${item.product}-${idx}`}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{money(item.unitPrice)}</td>
                            <td>{money(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="sales-empty">Couldn't load line items.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2>Create New Sale</h2>
                <p>Creates an invoice and atomically decrements product inventory.</p>
                <form onSubmit={handleSaveSale}>
                  <label>
                    Customer Name
                    <input
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      placeholder="e.g. Aman Traders (or leave blank for Walk-in)"
                    />
                  </label>

                  <label>
                    Select Product
                    <select
                      value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value })}
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                          {p.name} — ₹{p.price} ({p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Quantity
                    <input
                      required
                      type="number"
                      min="1"
                      max={selectedProduct?.quantity || 9999}
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })}
                    />
                  </label>

                  <label>
                    Discount (₹)
                    <input
                      type="number"
                      min="0"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: Math.max(0, Number(e.target.value)) })}
                    />
                  </label>

                  <label>
                    Payment Method
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                    </select>
                  </label>

                  <div style={{ margin: "16px 0", padding: "12px", background: "var(--s-soft)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Gross Amount:</span>
                      <strong>{money(calculatedGross)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Discount:</span>
                      <strong>- {money(form.discount)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "16px", borderTop: "1px solid var(--s-border)", paddingTop: "8px" }}>
                      <span>Net Total:</span>
                      <strong style={{ color: "#7c3aed" }}>{money(calculatedTotal)}</strong>
                    </div>
                  </div>

                  <button type="submit" className="sales-primary-btn" disabled={submitting} style={{ width: "100%" }}>
                    {submitting ? "Processing Sale..." : "Confirm & Save Sale"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
