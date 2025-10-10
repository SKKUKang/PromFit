// src/pages/Library.jsx
import React, { useEffect, useState, useMemo } from "react";
import NavBar from "../components/navBar";
import "./home.css"; // 모노톤 변수 재사용 (별도 css 안 만들어도 됨)

const API_URL = "https://jodee-unlapped-rachal.ngrok-free.dev/api/frameworks";

export default function Library() {
  const [list, setList] = useState([]);
  const [state, setState] = useState("loading"); // 'loading' | 'error' | 'done'
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

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
            // mode: "cors", // 명시하고 싶으면 추가
            cache: "no-store", // 캐시 혼선 방지(선택)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "목록 조회 실패");
        if (!isMounted) return;

        setList(Array.isArray(data?.frameworks) ? data.frameworks : []);
        setState("done");
      } catch (e) {
        if (!isMounted) return;
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
            {filtered.length === 0 ? (
              <div className="lib-empty">일치하는 프레임워크가 없습니다.</div>
            ) : (
              <section className="lib-grid">
                {filtered.map((fw) => (
                  <article key={fw.framework} className="lib-card" tabIndex={0}>
                    <div className="lib-card-head">
                      <h3 className="lib-card-title">{fw.framework}</h3>
                      {/* 필요하면 좋아요/작성자 같은 메타를 여기에 */}
                    </div>
                    <p className="lib-card-desc">
                      {fw.description || "설명이 없습니다."}
                    </p>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
