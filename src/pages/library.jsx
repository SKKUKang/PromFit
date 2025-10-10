// src/pages/Library.jsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import NavBar from "../components/navBar";
import "./home.css"; // 모노톤 변수 재사용

const API_URL = "https://jodee-unlapped-rachal.ngrok-free.dev/api/frameworks";

export default function Library() {
  const [list, setList] = useState([]);
  const [state, setState] = useState("loading"); // 'loading' | 'error' | 'done'
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  // 작성 모달 상태
  const [showForm, setShowForm] = useState(false);
  const [fwName, setFwName] = useState("");
  const [fwDesc, setFwDesc] = useState("");
  const [fwPrompt, setFwPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // 모달 내 첫 입력 자동 포커스
  const nameInputRef = useRef(null);

  // 초기 로드
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        setState("loading");
        const res = await fetch(API_URL, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const ct = res.headers.get("content-type") || "";
        const body = ct.includes("application/json")
          ? await res.json()
          : await res.text();

        if (!res.ok) {
          const msg =
            typeof body === "string"
              ? body.slice(0, 200)
              : body?.error || "목록 조회 실패";
          throw new Error(msg);
        }
        if (!ct.includes("application/json")) {
          throw new Error(
            "서버가 JSON 대신 HTML/텍스트를 반환했어요:\n" +
              String(body).slice(0, 200)
          );
        }
        if (!isMounted) return;

        setList(Array.isArray(body?.frameworks) ? body.frameworks : []);
        setState("done");
      } catch (e) {
        if (!isMounted) return;
        console.error("[Library] GET error:", e);
        setError(e.message || "네트워크 오류");
        setState("error");
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // 간단 검색(이름/설명)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((f) =>
      `${f.framework} ${f.description || ""}`.toLowerCase().includes(term)
    );
  }, [list, q]);

  // 모달 열기/닫기
  const openForm = useCallback(() => {
    setFormError("");
    setFwName("");
    setFwDesc("");
    setFwPrompt("");
    setShowForm(true);
  }, []);
  const closeForm = useCallback(() => {
    if (saving) return;
    setShowForm(false);
  }, [saving]);

  // ESC로 모달 닫기
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeForm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showForm, closeForm]);

  // 모달 열릴 때 첫 입력 포커스
  useEffect(() => {
    if (showForm && nameInputRef.current) {
      requestAnimationFrame(() => nameInputRef.current?.focus());
    }
  }, [showForm]);

  // 모달 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    const original = document.body.style.overflow;
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original;
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [showForm]);

  // 저장 (POST)
  const handleSave = useCallback(async () => {
    setFormError("");
    if (!fwName.trim() || !fwPrompt.trim()) {
      setFormError("이름(framework)과 변환 규칙(prompt_text)은 필수입니다.");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          framework: fwName.trim(),
          prompt_text: fwPrompt,
          description: fwDesc,
        }),
      });

      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("application/json")
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        const msg =
          typeof body === "string"
            ? body.slice(0, 200)
            : body?.error || "생성 실패";
        throw new Error(msg);
      }

      // 성공: 목록 최상단에 즉시 반영(낙관적 갱신)
      setList((prev) => [
        {
          framework: fwName.trim(),
          prompt_text: fwPrompt,
          author: "system",
          likes: 0,
          description: fwDesc,
        },
        ...prev,
      ]);

      setShowForm(false);
    } catch (e) {
      console.error("[Library] POST error:", e);
      setFormError(e.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }, [fwName, fwDesc, fwPrompt]);

  // 모달 내부에서 Ctrl/Cmd+Enter로 저장
  const handleFormKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !saving) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave, saving]
  );

  return (
    <div className="app-root" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <NavBar />

      <main className="main-section">
        <h1 className="lib-title">Framework Library</h1>

        <div className="lib-toolbar">
          <input
            className="lib-search"
            type="search"
            placeholder="프레임워크 검색 (이름/설명)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {state === "loading" && (
          <section className="loading-wrap">
            <div className="loading-card">
              <div className="spinner" aria-hidden />
              <div className="loading-text">목록을 불러오는 중…</div>
            </div>
          </section>
        )}

        {state === "error" && (
          <div className="lib-error">
            <div className="lib-error-title">불러오기 실패</div>
            <div className="lib-error-desc">{error}</div>
          </div>
        )}

        {state === "done" && (
          <>
            <section className="lib-grid">
              {/* + 추가 카드 */}
              <button
                type="button"
                className="lib-card lib-add-card"
                onClick={openForm}
                aria-label="나만의 프레임워크 추가"
              >
                <div className="lib-add-plus">＋</div>
                <div className="lib-add-text">새 프레임워크</div>
              </button>

              {/* 기존 카드들 */}
              {filtered.length === 0 ? (
                <article className="lib-card" tabIndex={0}>
                  <h3 className="lib-card-title">결과 없음</h3>
                  <p className="lib-card-desc">
                    검색어에 일치하는 프레임워크가 없습니다.
                  </p>
                </article>
              ) : (
                filtered.map((fw) => (
                  <article key={fw.framework} className="lib-card" tabIndex={0}>
                    <div className="lib-card-head">
                      <h3 className="lib-card-title">{fw.framework}</h3>
                    </div>
                    <p className="lib-card-desc">
                      {fw.description || "설명이 없습니다."}
                    </p>
                  </article>
                ))
              )}
            </section>
          </>
        )}

        {/* 작성 모달 */}
        {showForm && (
          <div className="lib-modal-overlay" onClick={closeForm}>
            <div
              className="lib-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lib-modal-title"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleFormKeyDown}
            >
              <h2 id="lib-modal-title" className="lib-modal-title">
                새 프레임워크 추가
              </h2>

              <label className="lib-field">
                <span className="lib-label">이름 (framework) *</span>
                <input
                  ref={nameInputRef}
                  className="lib-input"
                  type="text"
                  placeholder="예: MY_FRAME"
                  value={fwName}
                  onChange={(e) => setFwName(e.target.value)}
                />
              </label>

              <label className="lib-field">
                <span className="lib-label">설명 (description)</span>
                <textarea
                  className="lib-textarea"
                  rows={3}
                  placeholder="프레임워크에 대한 간단한 설명"
                  value={fwDesc}
                  onChange={(e) => setFwDesc(e.target.value)}
                />
              </label>

              <label className="lib-field">
                <span className="lib-label">변환 규칙 (prompt_text) *</span>
                <textarea
                  className="lib-textarea"
                  rows={8}
                  placeholder="LLM에 전달할 변환 규칙(템플릿)"
                  value={fwPrompt}
                  onChange={(e) => setFwPrompt(e.target.value)}
                />
              </label>

              {formError && <div className="lib-form-error">{formError}</div>}

              <div className="lib-modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeForm}
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="btn btn-solid-black"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "저장 중..." : "완료"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
