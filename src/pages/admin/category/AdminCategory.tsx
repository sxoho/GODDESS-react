import { useEffect, useState } from "react";

import { getSpringApiUrl } from "../../../components/ToolBak";
import "../../../styles/admin/AdminCategory.css";

type Category = {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  sortOrder: number;
  visible: string;
  children: Category[];
};

type CategoryForm = {
  name: string;
  description: string;
  sortOrder: number;
  visible: string;
};

const API_BASE = getSpringApiUrl();

const EMPTY_FORM: CategoryForm = {
  name: "",
  description: "",
  sortOrder: 1,
  visible: "Y",
};

const AdminCategory = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [formParentId, setFormParentId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/category/tree`
      );

      if (!response.ok) {
        throw new Error(
          "카테고리를 불러오지 못했습니다."
        );
      }

      const data: Category[] =
        await response.json();

      setCategories(data);

      setExpandedIds((current) => {
        if (current.length > 0) {
          return current.filter((id) =>
            data.some((category) =>
              category.id === id
            )
          );
        }

        return data.map(
          (category) => category.id
        );
      });
    } catch (error) {
      console.error(
        "카테고리 조회 오류",
        error
      );

      window.alert(
        "카테고리를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const toggleCategory = (
    categoryId: number
  ) => {
    setExpandedIds((current) =>
      current.includes(categoryId)
        ? current.filter(
            (id) => id !== categoryId
          )
        : [...current, categoryId]
    );
  };

  const openCreate = (
    parentId: number | null,
    childCount = 0
  ) => {
    setEditing(null);
    setFormParentId(parentId);

    setForm({
      ...EMPTY_FORM,
      sortOrder:
        parentId === null
          ? categories.length + 1
          : childCount + 1,
    });

    setIsFormOpen(true);
  };

  const openEdit = (
    category: Category
  ) => {
    setEditing(category);
    setFormParentId(
      category.parentId
    );

    setForm({
      name: category.name,
      description:
        category.description ?? "",
      sortOrder:
        category.sortOrder,
      visible:
        category.visible,
    });

    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setFormParentId(null);
    setForm(EMPTY_FORM);
  };

  const saveCategory = async () => {
    if (!form.name.trim()) {
      window.alert(
        "카테고리명을 입력해주세요."
      );
      return;
    }

    const body = {
      parentId:
        formParentId,
      name:
        form.name.trim(),
      description:
        form.description.trim(),
      sortOrder:
        Number(form.sortOrder),
      visible:
        form.visible,
    };

    try {
      const response = await fetch(
        editing
          ? `${API_BASE}/category/${editing.id}`
          : `${API_BASE}/category/save`,
        {
          method:
            editing
              ? "PUT"
              : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message ||
            "카테고리 저장에 실패했습니다."
        );
      }

      closeForm();
      await loadCategories();
    } catch (error) {
      console.error(
        "카테고리 저장 오류",
        error
      );

      window.alert(
        error instanceof Error &&
        error.message
          ? error.message
          : "카테고리 저장에 실패했습니다."
      );
    }
  };

  const deleteCategory = async (
    category: Category
  ) => {
    const categoryType =
      category.parentId === null
        ? "대분류"
        : "하위분류";

    if (
      !window.confirm(
        `'${category.name}' ${categoryType}를 삭제하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/category/${category.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message
        );
      }

      await loadCategories();
    } catch (error) {
      console.error(
        "카테고리 삭제 오류",
        error
      );

      window.alert(
        "하위 카테고리 또는 등록된 상품이 있는 카테고리는 삭제할 수 없습니다."
      );
    }
  };

  const totalChildCount =
    categories.reduce(
      (sum, category) =>
        sum +
        (category.children?.length ?? 0),
      0
    );

  return (
    <main className="admin-category-page">

      <header className="admin-category-header">
        <div>
          <p>
            PRODUCT CATEGORY
          </p>

          <h1>
            카테고리 관리
          </h1>

          <span>
            상품에 사용되는 대분류와 하위분류를 관리합니다.
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            openCreate(null)
          }
        >
          + 대분류 추가
        </button>
      </header>

      <section className="admin-category-summary">
        <div>
          <span>
            MAIN CATEGORY
          </span>

          <strong>
            {categories.length}
          </strong>

          <small>
            대분류
          </small>
        </div>

        <div>
          <span>
            SUB CATEGORY
          </span>

          <strong>
            {totalChildCount}
          </strong>

          <small>
            하위분류
          </small>
        </div>
      </section>

      {loading ? (
        <div className="admin-category-message">
          카테고리를 불러오는 중입니다.
        </div>
      ) : categories.length === 0 ? (
        <div className="admin-category-message">
          등록된 카테고리가 없습니다.
        </div>
      ) : (
        <section className="admin-category-tree">
          <div className="admin-category-table-head">
            <span>
              카테고리
            </span>

            <span>
              설명
            </span>

            <span>
              노출
            </span>

            <span>
              순서
            </span>

            <span>
              관리
            </span>
          </div>

          {categories
            .slice()
            .sort(
              (a, b) =>
                a.sortOrder -
                b.sortOrder
            )
            .map(
              (parent) => {
                const isExpanded =
                  expandedIds.includes(
                    parent.id
                  );

                const children =
                  (parent.children ?? [])
                    .slice()
                    .sort(
                      (a, b) =>
                        a.sortOrder -
                        b.sortOrder
                    );

                return (
                  <article
                    key={parent.id}
                    className="admin-category-group"
                  >
                    <div className="admin-category-main-row">
                      <div className="admin-category-name-cell">
                        <button
                          type="button"
                          className="admin-category-toggle"
                          onClick={() =>
                            toggleCategory(
                              parent.id
                            )
                          }
                          aria-label={
                            isExpanded
                              ? "하위분류 접기"
                              : "하위분류 펼치기"
                          }
                        >
                          {isExpanded
                            ? "−"
                            : "+"}
                        </button>

                        <div>
                          <strong>
                            {parent.name}
                          </strong>

                          <small>
                            대분류 · 하위{" "}
                            {children.length}개
                          </small>
                        </div>
                      </div>

                      <div className="admin-category-description">
                        {parent.description ||
                          "-"}
                      </div>

                      <div>
                        <span
                          className={`admin-category-visible ${
                            parent.visible ===
                            "Y"
                              ? "is-visible"
                              : "is-hidden"
                          }`}
                        >
                          {parent.visible ===
                          "Y"
                            ? "노출"
                            : "숨김"}
                        </span>
                      </div>

                      <div className="admin-category-order">
                        {parent.sortOrder}
                      </div>

                      <div className="admin-category-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openCreate(
                              parent.id,
                              children.length
                            )
                          }
                        >
                          + 하위분류
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(parent)
                          }
                        >
                          수정
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() =>
                            deleteCategory(
                              parent
                            )
                          }
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="admin-category-children">
                        {children.length ===
                        0 ? (
                          <div className="admin-category-child-empty">
                            등록된 하위분류가 없습니다.
                            <button
                              type="button"
                              onClick={() =>
                                openCreate(
                                  parent.id,
                                  0
                                )
                              }
                            >
                              하위분류 추가
                            </button>
                          </div>
                        ) : (
                          children.map(
                            (
                              child,
                              index
                            ) => (
                              <div
                                key={
                                  child.id
                                }
                                className="admin-category-child-row"
                              >
                                <div className="admin-category-name-cell child">
                                  <span className="admin-category-branch">
                                    {index ===
                                    children.length -
                                      1
                                      ? "└"
                                      : "├"}
                                  </span>

                                  <div>
                                    <strong>
                                      {
                                        child.name
                                      }
                                    </strong>

                                    <small>
                                      하위분류
                                    </small>
                                  </div>
                                </div>

                                <div className="admin-category-description">
                                  {child.description ||
                                    "-"}
                                </div>

                                <div>
                                  <span
                                    className={`admin-category-visible ${
                                      child.visible ===
                                      "Y"
                                        ? "is-visible"
                                        : "is-hidden"
                                    }`}
                                  >
                                    {child.visible ===
                                    "Y"
                                      ? "노출"
                                      : "숨김"}
                                  </span>
                                </div>

                                <div className="admin-category-order">
                                  {
                                    child.sortOrder
                                  }
                                </div>

                                <div className="admin-category-actions">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEdit(
                                        child
                                      )
                                    }
                                  >
                                    수정
                                  </button>

                                  <button
                                    type="button"
                                    className="delete"
                                    onClick={() =>
                                      deleteCategory(
                                        child
                                      )
                                    }
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>
                    )}
                  </article>
                );
              }
            )}
        </section>
      )}

      {isFormOpen && (
        <div
          className="admin-category-modal-backdrop"
          onMouseDown={closeForm}
        >
          <div
            className="admin-category-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-category-modal-head">
              <div>
                <span>
                  {editing
                    ? "EDIT CATEGORY"
                    : "NEW CATEGORY"}
                </span>

                <h2>
                  {editing
                    ? "카테고리 수정"
                    : formParentId !== null
                      ? "하위분류 추가"
                      : "대분류 추가"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            {formParentId !== null &&
              !editing && (
                <div className="admin-category-parent-guide">
                  <span>
                    상위 카테고리
                  </span>

                  <strong>
                    {
                      categories.find(
                        (category) =>
                          category.id ===
                          formParentId
                      )?.name
                    }
                  </strong>
                </div>
              )}

            <label>
              카테고리명

              <input
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name:
                      event.target
                        .value,
                  })
                }
                maxLength={100}
                placeholder="카테고리명을 입력하세요."
              />
            </label>

            <label>
              설명

              <input
                value={
                  form.description
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target
                        .value,
                  })
                }
                maxLength={255}
                placeholder="카테고리 설명을 입력하세요."
              />
            </label>

            <div className="admin-category-form-row">
              <label>
                정렬 순서

                <input
                  type="number"
                  min="1"
                  value={
                    form.sortOrder
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      sortOrder:
                        Number(
                          event.target
                            .value
                        ),
                    })
                  }
                />
              </label>

              <label>
                노출 여부

                <select
                  value={
                    form.visible
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      visible:
                        event.target
                          .value,
                    })
                  }
                >
                  <option value="Y">
                    노출
                  </option>

                  <option value="N">
                    숨김
                  </option>
                </select>
              </label>
            </div>

            <div className="admin-category-modal-actions">
              <button
                type="button"
                onClick={closeForm}
              >
                취소
              </button>

              <button
                type="button"
                onClick={saveCategory}
              >
                {editing
                  ? "수정하기"
                  : "추가하기"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default AdminCategory;
