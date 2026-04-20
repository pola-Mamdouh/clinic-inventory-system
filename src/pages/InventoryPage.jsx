import { useState, useEffect } from 'react';
import { Package, Plus, Pencil, Trash2, AlertTriangle, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import FieldError from '../components/ui/FieldError';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../firebase/inventory';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { required, numeric, minValue, inputCls } from '../utils/validators';

const INVENTORY_SCHEMA = {
  name:              [required('Item name is required')],
  quantity:          [required('Quantity is required'), numeric(), minValue(0, 'Quantity cannot be negative')],
  lowStockThreshold: [numeric(), minValue(0, 'Alert threshold cannot be negative')],
  price:             [numeric(), minValue(0, 'Price cannot be negative')],
};

const CATEGORIES = ['Medicine', 'Surgical', 'Diagnostic', 'Consumable', 'Equipment', 'Other'];
const UNITS = ['pcs', 'boxes', 'bottles', 'vials', 'packs', 'rolls', 'pairs', 'units'];

const EMPTY_FORM = {
  name: '', category: 'Medicine', unit: 'pcs',
  quantity: '', lowStockThreshold: '5', supplier: '', notes: '', price: ''
};

export default function InventoryPage() {
  const { role } = useAuth();
  const canMutate = role === 'admin' || role === 'inventory';
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const { errors, submitted, validateField, validateAll, resetValidation } = useFormValidation(INVENTORY_SCHEMA);

  const load = async () => {
    try {
      const data = await getInventory();
      setItems(data);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); resetValidation(); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item, quantity: String(item.quantity), lowStockThreshold: String(item.lowStockThreshold || 5), price: String(item.price || '') }); resetValidation(); setModalOpen(true); };
  // Always reset form on close — prevents stale data appearing in the next "Add Item" modal
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY_FORM); resetValidation(); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateAll(form)) return;
    setSaving(true);
    try {
      // Strip id and createdAt before writing — sending them back would overwrite
      // createdAt with a client-side value on update.
      const { id: _id, createdAt: _createdAt, ...formData } = form;
      const payload = {
        ...formData,
        quantity: Number(form.quantity) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
        price: Number(form.price) || 0,
      };
      if (editing) { await updateInventoryItem(editing.id, payload); toast.success('Item updated'); }
      else { await addInventoryItem(payload); toast.success('Item added'); }
      await load();
      closeModal();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await deleteInventoryItem(id); toast.success('Item deleted'); setItems(i => i.filter(x => x.id !== id)); }
    catch { toast.error('Delete failed'); }
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const filtered = items
    .filter(i => {
      const matchSearch = `${i.name} ${i.supplier} ${i.category}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'all' || i.category === catFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalItems = items.length;
  const lowStockCount = items.filter(i => i.quantity <= (i.lowStockThreshold || 5)).length;
  const outOfStock = items.filter(i => i.quantity === 0).length;
  const totalValue = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

  const SortIcon = ({ col }) => (
    <span className={`ml-1 inline-flex flex-col ${sortBy === col ? 'text-teal-400' : 'text-slate-700'}`}>
      {sortDir === 'asc' && sortBy === col ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
    </span>
  );

  const stockBadge = (item) => {
    if (item.quantity === 0) return 'danger';
    if (item.quantity <= (item.lowStockThreshold || 5)) return 'warning';
    return 'success';
  };

  const stockLabel = (item) => {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity <= (item.lowStockThreshold || 5)) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Inventory" subtitle="Manage medical supplies & medicines" />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Items" value={totalItems} icon={Package} color="teal" delay={0} />
          <StatCard title="Low Stock" value={lowStockCount} icon={AlertTriangle} color={lowStockCount > 0 ? 'amber' : 'emerald'} delay={100} />
          <StatCard title="Out of Stock" value={outOfStock} icon={TrendingDown} color={outOfStock > 0 ? 'red' : 'emerald'} delay={200} />
          <StatCard title="Total Value" value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Package} color="violet" delay={300} />
        </div>

        {/* Low stock banner */}
        {lowStockCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-3.5 animate-slide-up">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-amber-300">{lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low on stock</p>
              <p className="text-xs text-amber-400/60 mt-0.5">Review and reorder before supplies run out</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search items..." />
            <div className="flex gap-1.5 flex-wrap">
              {['all', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    catFilter === cat
                      ? 'bg-teal-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {/* Doctors can view inventory but not modify it */}
          {canMutate && (
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all shadow-glow-teal"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="No items found" description="Add your first inventory item to get started." />
        ) : (
          <div className="bg-navy-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {[
                      { key: 'name', label: 'Item' },
                      { key: 'category', label: 'Category' },
                      { key: 'quantity', label: 'Stock' },
                      { key: 'price', label: 'Unit Price' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: null, label: 'Status' },
                      { key: null, label: 'Actions' },
                    ].map(({ key, label }) => (
                      <th
                        key={label}
                        onClick={key ? () => toggleSort(key) : undefined}
                        className={`text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider ${key ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                      >
                        {label}{key && <SortIcon col={key} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((item, i) => {
                    const isLow = item.quantity <= (item.lowStockThreshold || 5);
                    return (
                      <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors animate-slide-up ${item.quantity === 0 ? 'opacity-60' : ''}`} style={{ animationDelay: `${i * 25}ms` }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              item.category === 'Medicine' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/20'
                              : item.category === 'Surgical' ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                              : 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                            }`}>
                              {item.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{item.name}</p>
                              {item.notes && <p className="text-xs text-slate-500 truncate max-w-[140px]">{item.notes}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-300">{item.category}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-display text-lg font-bold ${
                              item.quantity === 0 ? 'text-red-400'
                              : isLow ? 'text-amber-400'
                              : 'text-white'
                            }`}>
                              {item.quantity}
                            </span>
                            <span className="text-xs text-slate-500">{item.unit}</span>
                            {isLow && item.quantity > 0 && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </div>
                          {/* Stock bar */}
                          <div className="mt-1.5 w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.quantity === 0 ? 'bg-red-500'
                                : isLow ? 'bg-amber-500'
                                : 'bg-teal-500'
                              }`}
                              style={{ width: `${Math.min(100, (item.quantity / Math.max(item.quantity + 20, 50)) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-300">{item.price ? `$${item.price}` : '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-400 truncate max-w-[120px] block">{item.supplier || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={stockBadge(item)} dot>{stockLabel(item)}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          {canMutate && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(item)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-slate-400 transition-all">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Item' : 'Add Inventory Item'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Item Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); if (submitted) validateField('name', e.target.value); }}
              placeholder="e.g. Paracetamol 500mg"
              className={inputCls(!!errors.name)}
            />
            <FieldError message={errors.name} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-navy-800 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Unit</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full bg-navy-800 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Quantity *</label>
              <input
                type="number" min="0"
                value={form.quantity}
                onChange={e => { const v = e.target.value; setForm({ ...form, quantity: v }); if (submitted) validateField('quantity', v); }}
                placeholder="0"
                className={inputCls(!!errors.quantity)}
              />
              <FieldError message={errors.quantity} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Low Alert At</label>
              <input
                type="number" min="0"
                value={form.lowStockThreshold}
                onChange={e => { const v = e.target.value; setForm({ ...form, lowStockThreshold: v }); if (submitted) validateField('lowStockThreshold', v); }}
                placeholder="5"
                className={inputCls(!!errors.lowStockThreshold)}
              />
              <FieldError message={errors.lowStockThreshold} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Unit Price ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={e => { const v = e.target.value; setForm({ ...form, price: v }); if (submitted) validateField('price', v); }}
                placeholder="0.00"
                className={inputCls(!!errors.price)}
              />
              <FieldError message={errors.price} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Supplier</label>
            <input type="text" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Storage instructions, expiry info..." className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editing ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
