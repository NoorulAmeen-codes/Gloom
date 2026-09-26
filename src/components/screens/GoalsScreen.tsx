"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Plus,
  Target,
  Trophy,
  X,
} from "lucide-react";

type GoalCategory = {
  id: number;
  user_id: number;
  name: string;
  icon: string | null;
  created_at: string;
};

type Goal = {
  id: number;
  category_id: number;
  category_name: string;
  category_icon: string | null;
  title: string;
  description: string | null;
  is_achieved: boolean;
  achieved_at: string | null;
  created_at: string;
};

const inputStyle = {
  backgroundColor: "var(--color-surface)",
  borderColor: "var(--color-border)",
  color: "var(--color-text)",
};

export function GoalsScreen() {
  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("🎯");

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");

  const [savingCategory, setSavingCategory] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  const [achievingId, setAchievingId] = useState<number | null>(null);
  const [confirmGoal, setConfirmGoal] = useState<Goal | null>(null);

  const [openCategories, setOpenCategories] = useState<
    Record<number, boolean>
  >({});

  async function loadGoals(showLoading = true) {
  if (showLoading) {
    setLoading(true);
  }

  setError("");

    try {
      const [categoriesResponse, goalsResponse] = await Promise.all([
        fetch("/api/goal-categories"),
        fetch("/api/goals"),
      ]);

      if (!categoriesResponse.ok || !goalsResponse.ok) {
        throw new Error("Failed to load goals");
      }

      const categoriesData = await categoriesResponse.json();
      const goalsData = await goalsResponse.json();

      const loadedCategories = categoriesData.categories || [];
      const loadedGoals = goalsData.goals || [];

      setCategories(loadedCategories);
      setGoals(loadedGoals);

      setOpenCategories((current) => {
        const next = { ...current };

        loadedCategories.forEach((category: GoalCategory, index: number) => {
          if (next[category.id] === undefined) {
            next[category.id] = index === 0;
          }
        });

        return next;
      });
    } catch (err) {
      console.error(err);
      setError("Could not load your goals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  void loadGoals(true);
}, []);

  const totalGoals = goals.length;
  const achievedGoals = goals.filter((goal) => goal.is_achieved).length;

  const overallProgress =
    totalGoals === 0
      ? 0
      : Math.round((achievedGoals / totalGoals) * 100);

  const goalsByCategory = useMemo(() => {
    const map = new Map<number, Goal[]>();

    goals.forEach((goal) => {
      const current = map.get(goal.category_id) || [];
      current.push(goal);
      map.set(goal.category_id, current);
    });

    return map;
  }, [goals]);

  function openAddCategory() {
    setCategoryName("");
    setCategoryIcon("🎯");
    setCategoryModalOpen(true);
  }

  function openAddGoal(categoryId: number) {
    setSelectedCategoryId(categoryId);
    setGoalTitle("");
    setGoalDescription("");
    setGoalModalOpen(true);
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();

    const name = categoryName.trim();

    if (!name) {
      return;
    }

    setSavingCategory(true);
    setError("");

    try {
      const response = await fetch("/api/goal-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          icon: categoryIcon.trim() || "🎯",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create category.");
        return;
      }

      setCategoryModalOpen(false);

      await loadGoals(false);

      if (data.category?.id) {
        setOpenCategories((current) => ({
          ...current,
          [data.category.id]: true,
        }));
      }
    } catch (err) {
      console.error(err);
      setError("Could not create category.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function createGoal(event: React.FormEvent) {
    event.preventDefault();

    const title = goalTitle.trim();

    if (!selectedCategoryId || !title) {
      return;
    }

    setSavingGoal(true);
    setError("");

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: selectedCategoryId,
          title,
          description: goalDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create goal.");
        return;
      }

      setGoalModalOpen(false);

      setOpenCategories((current) => ({
        ...current,
        [selectedCategoryId]: true,
      }));

      await loadGoals(false);
    } catch (err) {
      console.error(err);
      setError("Could not create goal.");
    } finally {
      setSavingGoal(false);
    }
  }

  async function achieveGoal() {
    if (!confirmGoal) {
      return;
    }

    const goal = confirmGoal;

    setAchievingId(goal.id);
    setError("");

    try {
      const response = await fetch(
        `/api/goals/${goal.id}/achieve`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not achieve this goal.");
        return;
      }

      setGoals((current) =>
        current.map((item) =>
          item.id === goal.id
            ? {
                ...item,
                is_achieved: true,
                achieved_at: data.goal?.achieved_at || new Date().toISOString(),
              }
            : item
        )
      );

      setConfirmGoal(null);
    } catch (err) {
      console.error(err);
      setError("Could not achieve this goal.");
    } finally {
      setAchievingId(null);
    }
  }

  function toggleCategory(categoryId: number) {
    setOpenCategories((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            My Goals
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Turn your dreams into achievements.
          </p>
        </div>

        <button
          onClick={openAddCategory}
          className="shrink-0 rounded-xl px-3.5 py-3 text-sm font-bold text-white inline-flex gap-1.5 items-center"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus className="w-4 h-4" />
          Category
        </button>
      </div>

      {/* Overall progress */}
      <section
        className="rounded-3xl p-5 border shadow-sm"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "var(--color-primary-light)",
              color: "var(--color-primary)",
            }}
          >
            <Trophy className="w-7 h-7" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-xs uppercase tracking-wider font-bold"
              style={{ color: "var(--color-text-muted)" }}
            >
              Life goals
            </p>

            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-black">
                {achievedGoals}
              </span>

              <span
                className="text-sm mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                of {totalGoals} achieved
              </span>
            </div>
          </div>

          <span
            className="text-lg font-black"
            style={{ color: "var(--color-primary)" }}
          >
            {overallProgress}%
          </span>
        </div>

        <div
          className="h-2 rounded-full mt-5 overflow-hidden"
          style={{
            backgroundColor: "var(--color-surface-alt)",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              backgroundColor: "var(--color-primary)",
              width: `${overallProgress}%`,
            }}
          />
        </div>

        <p
          className="text-xs mt-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          Every achieved goal stays achieved forever.
        </p>
      </section>

      {/* Error */}
      {error && (
        <div
          className="rounded-2xl border p-3 text-sm font-semibold"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-danger)",
            color: "var(--color-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Categories */}
      {loading ? (
        <div
          className="rounded-3xl p-8 border text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          Loading your goals…
        </div>
      ) : categories.length === 0 ? (
        <section
          className="rounded-3xl p-8 border text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-primary-light)",
              color: "var(--color-primary)",
            }}
          >
            <Target className="w-8 h-8" />
          </div>

          <h2 className="font-extrabold text-lg mt-4">
            Start your life goals
          </h2>

          <p
            className="text-sm mt-1 max-w-xs mx-auto"
            style={{ color: "var(--color-text-muted)" }}
          >
            Create categories such as Travel, Dream Job, Finance,
            Health or Education.
          </p>

          <button
            onClick={openAddCategory}
            className="mt-5 rounded-xl px-4 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            + Create your first category
          </button>
        </section>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const categoryGoals =
              goalsByCategory.get(category.id) || [];

            const categoryAchieved = categoryGoals.filter(
              (goal) => goal.is_achieved
            ).length;

            const categoryProgress =
              categoryGoals.length === 0
                ? 0
                : Math.round(
                    (categoryAchieved / categoryGoals.length) * 100
                  );

            const isOpen = openCategories[category.id] ?? true;

            return (
              <section
                key={category.id}
                className="rounded-3xl border shadow-sm overflow-hidden"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{
                        backgroundColor:
                          "var(--color-primary-light)",
                      }}
                    >
                      {category.icon || "🎯"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-extrabold truncate">
                        {category.name}
                      </h2>

                      <p
                        className="text-xs mt-0.5"
                        style={{
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {categoryAchieved} of {categoryGoals.length}{" "}
                        achieved
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-black"
                        style={{
                          color: "var(--color-primary)",
                        }}
                      >
                        {categoryProgress}%
                      </span>

                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        style={{
                          color: "var(--color-text-muted)",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="h-1.5 rounded-full mt-3 overflow-hidden"
                    style={{
                      backgroundColor: "var(--color-surface-alt)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        width: `${categoryProgress}%`,
                      }}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div
                    className="px-4 pb-4 pt-1 border-t"
                    style={{
                      borderColor: "var(--color-border)",
                    }}
                  >
                    {categoryGoals.length === 0 ? (
                      <p
                        className="text-sm py-4 text-center"
                        style={{
                          color: "var(--color-text-muted)",
                        }}
                      >
                        No goals in this category yet.
                      </p>
                    ) : (
                      <div className="space-y-2 pt-3">
                        {categoryGoals.map((goal) => (
                          <div
                            key={goal.id}
                            className="flex items-center gap-3 rounded-2xl border p-3"
                            style={{
                              backgroundColor:
                                "var(--color-surface-alt)",
                              borderColor:
                                "var(--color-border)",
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: goal.is_achieved
                                  ? "var(--color-primary)"
                                  : "var(--color-surface)",
                                color: goal.is_achieved
                                  ? "#ffffff"
                                  : "var(--color-text-muted)",
                              }}
                            >
                              {goal.is_achieved ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Target className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-bold ${
                                  goal.is_achieved
                                    ? "line-through opacity-70"
                                    : ""
                                }`}
                              >
                                {goal.title}
                              </p>

                              {goal.description && (
                                <p
                                  className="text-xs mt-0.5"
                                  style={{
                                    color:
                                      "var(--color-text-muted)",
                                  }}
                                >
                                  {goal.description}
                                </p>
                              )}

                              {goal.is_achieved && (
                                <p
                                  className="text-[10px] mt-1 font-semibold"
                                  style={{
                                    color:
                                      "var(--color-primary)",
                                  }}
                                >
                                  ✓ Achieved permanently
                                </p>
                              )}
                            </div>

                            {goal.is_achieved ? (
                              <CheckCircle2
                                className="w-5 h-5 shrink-0"
                                style={{
                                  color:
                                    "var(--color-primary)",
                                }}
                              />
                            ) : (
                              <button
                                onClick={() =>
                                  setConfirmGoal(goal)
                                }
                                className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-white"
                                style={{
                                  backgroundColor:
                                    "var(--color-primary)",
                                }}
                              >
                                Achieve
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() =>
                        openAddGoal(category.id)
                      }
                      className="w-full mt-3 rounded-xl py-2.5 text-sm font-bold border"
                      style={{
                        color: "var(--color-primary)",
                        borderColor: "var(--color-border)",
                        backgroundColor:
                          "var(--color-surface)",
                      }}
                    >
                      + Add goal
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Add category modal */}
      {categoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{
            backgroundColor: "rgba(15,23,42,.5)",
          }}
        >
          <form
            onSubmit={createCategory}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-xl"
            style={{
              backgroundColor: "var(--color-surface)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">
                Add category
              </h2>

              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-5">
              <label className="block text-sm font-bold">
                Category name

                <input
                  autoFocus
                  required
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(event.target.value)
                  }
                  placeholder="Travel"
                  className="w-full rounded-xl border px-3 py-3 mt-1.5"
                  style={inputStyle}
                />
              </label>

              <label className="block text-sm font-bold">
                Icon

                <input
                  value={categoryIcon}
                  onChange={(event) =>
                    setCategoryIcon(event.target.value)
                  }
                  maxLength={4}
                  className="w-full rounded-xl border px-3 py-3 mt-1.5 text-xl"
                  style={inputStyle}
                />

                <span
                  className="text-xs font-normal mt-1 block"
                  style={{
                    color: "var(--color-text-muted)",
                  }}
                >
                  Example: ✈️ 🌍 💼 💰 ❤️
                </span>
              </label>

              <button
                disabled={savingCategory}
                className="w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-60"
                style={{
                  backgroundColor: "var(--color-primary)",
                }}
              >
                {savingCategory
                  ? "Creating…"
                  : "Create category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add goal modal */}
      {goalModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{
            backgroundColor: "rgba(15,23,42,.5)",
          }}
        >
          <form
            onSubmit={createGoal}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-xl"
            style={{
              backgroundColor: "var(--color-surface)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">
                Add goal
              </h2>

              <button
                type="button"
                onClick={() => setGoalModalOpen(false)}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-5">
              <label className="block text-sm font-bold">
                Goal

                <input
                  autoFocus
                  required
                  value={goalTitle}
                  onChange={(event) =>
                    setGoalTitle(event.target.value)
                  }
                  placeholder="Visit Japan"
                  className="w-full rounded-xl border px-3 py-3 mt-1.5"
                  style={inputStyle}
                />
              </label>

              <label className="block text-sm font-bold">
                Description{" "}
                <span
                  className="font-normal"
                  style={{
                    color: "var(--color-text-muted)",
                  }}
                >
                  (optional)
                </span>

                <textarea
                  value={goalDescription}
                  onChange={(event) =>
                    setGoalDescription(event.target.value)
                  }
                  placeholder="See Tokyo, Kyoto and Mount Fuji."
                  rows={3}
                  className="w-full rounded-xl border px-3 py-3 mt-1.5 resize-none"
                  style={inputStyle}
                />
              </label>

              <button
                disabled={savingGoal}
                className="w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-60"
                style={{
                  backgroundColor: "var(--color-primary)",
                }}
              >
                {savingGoal ? "Saving…" : "Add goal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permanent achievement confirmation */}
      {confirmGoal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(15,23,42,.5)",
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-5 shadow-xl"
            style={{
              backgroundColor: "var(--color-surface)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{
                backgroundColor: "var(--color-primary-light)",
                color: "var(--color-primary)",
              }}
            >
              <Trophy className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-extrabold text-center mt-4">
              Achieve this goal?
            </h2>

            <p className="text-sm text-center mt-2">
              {confirmGoal.title}
            </p>

            <p
              className="text-xs text-center mt-3 leading-relaxed"
              style={{
                color: "var(--color-text-muted)",
              }}
            >
              Once you mark this goal as achieved, it cannot be
              undone.
            </p>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmGoal(null)}
                disabled={achievingId !== null}
                className="flex-1 rounded-xl py-3 text-sm font-bold border"
                style={inputStyle}
              >
                Cancel
              </button>

              <button
                onClick={achieveGoal}
                disabled={achievingId !== null}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
                style={{
                  backgroundColor: "var(--color-primary)",
                }}
              >
                {achievingId !== null
                  ? "Saving…"
                  : "Yes, achieve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}