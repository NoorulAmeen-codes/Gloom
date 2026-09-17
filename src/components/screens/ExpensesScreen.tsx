"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, WalletCards, X } from "lucide-react";
import { CATEGORY_ICONS, EXPENSE_CATEGORIES, PAYMENT_METHODS, formatRupees, type ExpenseCategory } from "@/lib/expenses";
import { useApp } from "@/context/AppContext";

type Expense = { id: number; amount: string; category: ExpenseCategory; description: string | null; payment_method: string; expense_date: string; expense_time: string };
type FormData = { amount: string; category: ExpenseCategory; description: string; expense_date: string; expense_time: string; payment_method: string };
const inputStyle = { backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" };

function localDate(offset = 0) { const date = new Date(); date.setDate(date.getDate() + offset); return date.toLocaleDateString("en-CA"); }
function shiftDate(dateString: string, by: number) { const [y, m, d] = dateString.split("-").map(Number); const date = new Date(y, m - 1, d); date.setDate(date.getDate() + by); return date.toLocaleDateString("en-CA"); }
function monthOf(date: string) { return date.slice(0, 7); }
function shiftMonth(month: string, by: number) { const [y, m] = month.split("-").map(Number); return new Date(y, m - 1 + by, 1).toLocaleDateString("en-CA").slice(0, 7); }
function niceDate(date: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" }) { return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", options); }
function defaultForm(date = localDate()): FormData { return { amount: "", category: "Food", description: "", expense_date: date, expense_time: new Date().toTimeString().slice(0, 5), payment_method: "UPI" }; }

export function ExpensesScreen() {
  const { user } = useApp();
  const today = useMemo(() => localDate(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(monthOf(today));
  const [dayExpenses, setDayExpenses] = useState<Expense[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm(today));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategory, setHistoryCategory] = useState("");
  const [historyPayment, setHistoryPayment] = useState("");
  const [budget, setBudget] = useState(() => typeof window === "undefined" ? "" : localStorage.getItem("gloop-monthly-expense-budget") || "");
  const [showBudget, setShowBudget] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [day, monthly] = await Promise.all([fetch(`/api/expenses?date=${selectedDate}`), fetch(`/api/expenses?month=${month}`)]);
      if (day.ok) setDayExpenses((await day.json()).expenses || []);
      if (monthly.ok) setMonthExpenses((await monthly.json()).expenses || []);
    } finally { setLoading(false); }
  }, [selectedDate, month]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const selectedTotal = dayExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const monthTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const dailyTotals = new Map<string, number>();
  monthExpenses.forEach((expense) => dailyTotals.set(expense.expense_date, (dailyTotals.get(expense.expense_date) || 0) + Number(expense.amount)));
  const highestDay = Math.max(0, ...dailyTotals.values());
  const categories = EXPENSE_CATEGORIES.map((category) => ({ category, total: monthExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + Number(expense.amount), 0) })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
  const filteredHistory = monthExpenses.filter((expense) => (!historyCategory || expense.category === historyCategory) && (!historyPayment || expense.payment_method === historyPayment) && (!historySearch || (expense.description || "").toLowerCase().includes(historySearch.toLowerCase())));
  const historyGroups = filteredHistory.reduce<Record<string, Expense[]>>((groups, expense) => { (groups[expense.expense_date] ||= []).push(expense); return groups; }, {});
  const parsedBudget = Number(budget);

  function openAdd() { setEditing(null); setError(""); setForm(defaultForm(selectedDate)); setFormOpen(true); }
  function openEdit(expense: Expense) { setEditing(expense); setError(""); setForm({ amount: expense.amount, category: expense.category, description: expense.description || "", expense_date: expense.expense_date, expense_time: expense.expense_time, payment_method: expense.payment_method }); setFormOpen(true); }
  useEffect(() => {
    window.addEventListener("gloop:add-expense", openAdd);
    return () => window.removeEventListener("gloop:add-expense", openAdd);
  });
  async function save(event: FormEvent) {
    event.preventDefault(); setError("");
    if (!/^\d+(\.\d{1,2})?$/.test(form.amount) || Number(form.amount) <= 0) { setError("Enter a positive amount."); return; }
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/expenses/${editing.id}` : "/api/expenses", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Could not save this expense."); return; }
      setFormOpen(false); await load();
    } catch { setError("Could not save this expense. Please try again."); } finally { setSaving(false); }
  }
  async function remove() { if (!deleteTarget) return; const response = await fetch(`/api/expenses/${deleteTarget.id}`, { method: "DELETE" }); if (response.ok) { setDeleteTarget(null); await load(); } else setError("Could not delete this expense."); }
  function saveBudget() { if (budget && (!/^\d+(\.\d{1,2})?$/.test(budget) || Number(budget) < 0)) return; localStorage.setItem("gloop-monthly-expense-budget", budget); setShowBudget(false); }

  return <div className="space-y-5 pb-24 lg:pb-12 animate-in fade-in duration-300">
    <div className="flex items-start justify-between gap-3"><div><h1 className="text-3xl font-extrabold tracking-tight">Expenses</h1><p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Keep a clear view of your daily spending.</p></div><button onClick={openAdd} className="shrink-0 rounded-xl px-3.5 py-3 text-sm font-bold text-white inline-flex gap-1.5 items-center" style={{ backgroundColor: "var(--color-primary)" }}><Plus className="w-4 h-4" /> Add</button></div>

    <section className="rounded-3xl p-5 border shadow-sm" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}><div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wider font-bold" style={{ color: "var(--color-text-muted)" }}>{selectedDate === today ? "Today’s Spending" : niceDate(selectedDate)}</p><p className="text-3xl font-black mt-1">{formatRupees(selectedTotal)}</p><p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{dayExpenses.length} {dayExpenses.length === 1 ? "expense" : "expenses"}</p></div><WalletCards className="w-10 h-10" style={{ color: "var(--color-primary)" }} /></div>
      <div className="grid grid-cols-4 gap-2 mt-5"><button onClick={() => setSelectedDate(today)} className="rounded-xl py-2.5 text-xs font-bold border" style={inputStyle}>Today</button><button onClick={() => setSelectedDate(localDate(-1))} className="rounded-xl py-2.5 text-xs font-bold border" style={inputStyle}>Yesterday</button><button onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} aria-label="Previous day" className="rounded-xl py-2.5 border flex justify-center" style={inputStyle}><ChevronLeft className="w-4 h-4" /></button><button onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} aria-label="Next day" className="rounded-xl py-2.5 border flex justify-center" style={inputStyle}><ChevronRight className="w-4 h-4" /></button></div>
      <label className="relative block mt-3"><CalendarDays className="absolute left-3 top-3 w-4 h-4" style={{ color: "var(--color-text-muted)" }} /><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm" style={inputStyle} /></label>
    </section>

    <section className="rounded-3xl p-5 border shadow-sm" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}><div className="flex items-center justify-between mb-3"><h2 className="font-bold">Expenses for {niceDate(selectedDate)}</h2><span className="text-sm font-black" style={{ color: "var(--color-primary)" }}>{formatRupees(selectedTotal)}</span></div>{loading ? <p className="text-sm py-5 text-center" style={{ color: "var(--color-text-muted)" }}>Loading expenses…</p> : dayExpenses.length === 0 ? <div className="py-7 text-center"><p className="font-bold">No expenses yet</p><p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Start tracking your spending today.</p><button onClick={openAdd} className="mt-4 text-sm font-bold" style={{ color: "var(--color-primary)" }}>+ Add Expense</button></div> : <div className="space-y-2">{dayExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} onEdit={openEdit} onDelete={setDeleteTarget} />)}</div>}</section>

    <section className="rounded-3xl p-5 border shadow-sm" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}><div className="flex items-center justify-between"><button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="p-2"><ChevronLeft className="w-5 h-5" /></button><h2 className="font-bold">{new Date(`${month}-01T12:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2><button onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month" className="p-2"><ChevronRight className="w-5 h-5" /></button></div><button onClick={() => setMonth(monthOf(today))} className="w-full text-xs font-bold mt-1" style={{ color: "var(--color-primary)" }}>Current month</button><div className="grid grid-cols-2 gap-3 mt-4"><Stat label="Total spent" value={formatRupees(monthTotal)} /><Stat label="Transactions" value={String(monthExpenses.length)} /><Stat label="Daily average" value={formatRupees(monthTotal / daysInMonth)} /><Stat label="Highest day" value={formatRupees(highestDay)} /></div>
      <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}><div className="flex justify-between items-center"><h3 className="font-bold text-sm">Monthly budget</h3><button onClick={() => setShowBudget(!showBudget)} className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{budget ? "Edit" : "Set budget"}</button></div>{showBudget && <div className="flex gap-2 mt-3"><input inputMode="decimal" placeholder="₹ 20,000" value={budget} onChange={(e) => setBudget(e.target.value)} className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm" style={inputStyle}/><button onClick={saveBudget} className="rounded-xl px-3 text-xs font-bold text-white" style={{ backgroundColor: "var(--color-primary)" }}>Save</button></div>}{parsedBudget > 0 && <div className="grid grid-cols-3 gap-2 mt-3 text-center"><SmallStat label="Budget" value={formatRupees(parsedBudget)} /><SmallStat label="Spent" value={formatRupees(monthTotal)} /><SmallStat label="Remaining" value={formatRupees(parsedBudget - monthTotal)} /></div>}</div></section>

    <section className="rounded-3xl p-5 border shadow-sm" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}><h2 className="font-bold">Category breakdown</h2>{categories.length === 0 ? <p className="text-sm mt-3" style={{ color: "var(--color-text-muted)" }}>No spending recorded this month.</p> : <div className="space-y-3 mt-4">{categories.map(({ category, total }) => <div key={category}><div className="flex justify-between text-sm"><span>{CATEGORY_ICONS[category]} {category}</span><b>{formatRupees(total)}</b></div><div className="h-2 rounded-full mt-1.5" style={{ backgroundColor: "var(--color-surface-alt)" }}><div className="h-full rounded-full" style={{ backgroundColor: "var(--color-primary)", width: `${Math.max(3, (total / monthTotal) * 100)}%` }} /></div></div>)}</div>}</section>

    <section className="rounded-3xl p-5 border shadow-sm" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}><h2 className="font-bold">Expense history</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4"><label className="relative"><Search className="w-4 h-4 absolute left-3 top-3" style={{ color: "var(--color-text-muted)" }}/><input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search description" className="w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm" style={inputStyle}/></label><select value={historyCategory} onChange={(e) => setHistoryCategory(e.target.value)} className="rounded-xl border px-3 py-2.5 text-sm" style={inputStyle}><option value="">All categories</option>{EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select><select value={historyPayment} onChange={(e) => setHistoryPayment(e.target.value)} className="rounded-xl border px-3 py-2.5 text-sm" style={inputStyle}><option value="">All payments</option>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></div><div className="space-y-5 mt-5">{Object.entries(historyGroups).sort(([a], [b]) => b.localeCompare(a)).map(([date, expenses]) => <div key={date}><div className="flex justify-between mb-2"><h3 className="text-sm font-bold">{niceDate(date, { day: "numeric", month: "long", year: "numeric" })}</h3><span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{formatRupees(expenses.reduce((sum, expense) => sum + Number(expense.amount), 0))}</span></div><div className="space-y-2">{expenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} onEdit={openEdit} onDelete={setDeleteTarget} />)}</div></div>)}{!filteredHistory.length && <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>No matching expenses for this month.</p>}</div></section>

    {formOpen && <ExpenseForm form={form} setForm={setForm} editing={editing} error={error} saving={saving} onClose={() => setFormOpen(false)} onSave={save} />}
    {deleteTarget && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,.5)" }}><div className="w-full max-w-sm rounded-3xl p-5 shadow-xl" style={{ backgroundColor: "var(--color-surface)" }}><h2 className="text-lg font-bold">Delete this expense?</h2><p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>{formatRupees(deleteTarget.amount)} · {deleteTarget.description || deleteTarget.category}</p><div className="flex gap-3 mt-5"><button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl py-3 text-sm font-bold border" style={inputStyle}>Cancel</button><button onClick={remove} className="flex-1 rounded-xl py-3 text-sm font-bold text-white" style={{ backgroundColor: "var(--color-danger)" }}>Delete</button></div></div></div>}
  </div>;
}

function ExpenseRow({ expense, onEdit, onDelete }: { expense: Expense; onEdit: (expense: Expense) => void; onDelete: (expense: Expense) => void }) { return <div className="flex items-center gap-3 p-3 rounded-2xl border" style={{ backgroundColor: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}><span className="text-xl">{CATEGORY_ICONS[expense.category]}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold truncate">{expense.description || expense.category}</p><p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{expense.category} · {expense.payment_method} · {new Date(`1970-01-01T${expense.expense_time}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p></div><b className="text-sm whitespace-nowrap">{formatRupees(expense.amount)}</b><button onClick={() => onEdit(expense)} className="p-2" aria-label="Edit expense"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => onDelete(expense)} className="p-2" aria-label="Delete expense" style={{ color: "var(--color-danger)" }}><Trash2 className="w-3.5 h-3.5" /></button></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--color-surface-alt)" }}><p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{label}</p><p className="font-black text-sm mt-1 truncate">{value}</p></div>; }
function SmallStat({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</p><p className="font-bold text-xs mt-0.5 truncate">{value}</p></div>; }
function ExpenseForm({ form, setForm, editing, error, saving, onClose, onSave }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>>; editing: Expense | null; error: string; saving: boolean; onClose: () => void; onSave: (event: FormEvent) => void }) { const update = (key: keyof FormData, value: string) => setForm((current) => ({ ...current, [key]: value })); return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(15,23,42,.5)" }}><form onSubmit={onSave} className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-xl max-h-[92vh] overflow-y-auto" style={{ backgroundColor: "var(--color-surface)" }}><div className="flex justify-between items-center"><h2 className="text-xl font-extrabold">{editing ? "Edit Expense" : "Add Expense"}</h2><button type="button" onClick={onClose} className="p-2"><X className="w-5 h-5" /></button></div><div className="space-y-3 mt-5"><label className="block text-sm font-bold">Amount<input required autoFocus inputMode="decimal" placeholder="₹ 0.00" value={form.amount} onChange={(e) => update("amount", e.target.value)} className="w-full rounded-xl border px-3 py-3 mt-1.5 text-lg" style={inputStyle}/></label><label className="block text-sm font-bold">Category<select required value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full rounded-xl border px-3 py-3 mt-1.5" style={inputStyle}>{EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label><label className="block text-sm font-bold">Description <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>(optional)</span><input value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Lunch" className="w-full rounded-xl border px-3 py-3 mt-1.5" style={inputStyle}/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-bold">Date<input required type="date" value={form.expense_date} onChange={(e) => update("expense_date", e.target.value)} className="w-full rounded-xl border px-3 py-3 mt-1.5" style={inputStyle}/></label><label className="text-sm font-bold">Time<input required type="time" value={form.expense_time} onChange={(e) => update("expense_time", e.target.value)} className="w-full rounded-xl border px-3 py-3 mt-1.5" style={inputStyle}/></label></div><label className="block text-sm font-bold">Payment<select required value={form.payment_method} onChange={(e) => update("payment_method", e.target.value)} className="w-full rounded-xl border px-3 py-3 mt-1.5" style={inputStyle}>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></label>{error && <p className="text-sm font-semibold" style={{ color: "var(--color-danger)" }}>{error}</p>}<button disabled={saving} className="w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-60" style={{ backgroundColor: "var(--color-primary)" }}>{saving ? "Saving…" : "Save Expense"}</button></div></form></div>; }
