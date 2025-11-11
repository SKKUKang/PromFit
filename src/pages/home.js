// src/pages/home.js
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import NavBar from '../components/navBar';
import PromptInput from '../components/PromptInput';
import LoadingSection from '../components/LoadingSection';
import ResultSection from '../components/ResultSection';
import './home.css';
import { API_BASE } from '../config';

// ▼ 백엔드 호출
async function callPromptAPI(prompt, framework) {
  const API_URL = `${API_BASE}/api/prompt`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, framework }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || '요청 실패');
  }
  return String(data?.refined_prompt ?? '')
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '');
}

export default function Home() {
  const [viewState, setViewState] = useState('idle'); // 'idle' | 'loading' | 'done'
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState([]);

  // ✅ 단일 선택 프레임워크 상태 (기본 프레임워크 & 사용자 프레임워크 모두 포함)
  //   예: 'TAG' | 'RTF' | 'BAB' | 'CARE' | 'CO_STAR' | 'MY_FRAME' | null
  const [selectedFramework, setSelectedFramework] = useState(null);

  // ✅ Library에서 추가된 사용자 프레임워크 이름 목록
  const [customFrameworks, setCustomFrameworks] = useState([]);

  const showIntro = useMemo(() => viewState === 'idle', [viewState]);

  // 사용자 프레임워크 로드
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/frameworks`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        const ct = res.headers.get('content-type') || '';
        const body = ct.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) throw new Error(typeof body === 'string' ? body : (body?.error || '목록 조회 실패'));
        if (!ct.includes('application/json')) throw new Error('JSON이 아닌 응답입니다.');
        if (!isMounted) return;

        // ✅ 기본 5종은 제외 + 대소문자 안전 + 중복 제거
        const RESERVED = new Set(['RTF','TAG','BAB','CARE','CO_STAR']);
        const names = Array.isArray(body?.frameworks)
          ? body.frameworks
              .map(f => String(f.framework || '').trim())
              .filter(Boolean)
              .filter(name => !RESERVED.has(name.toUpperCase()))
        : [];

        // 중복 제거
        const unique = Array.from(new Set(names.map(n => n.toUpperCase())))
          .map(u => names.find(n => n.toUpperCase() === u)); // 원래 표기 유지

        setCustomFrameworks(unique);
      } catch (e) {
        console.warn('[Home] custom frameworks fetch failed:', e);
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // 제출(엔터/버튼) → loading → done
  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;
    setViewState('loading');

    const asked = inputText; // 당시 질문 보존
    const framework = selectedFramework ?? 'TAG'; // 미선택 시 TAG

    try {
      const converted = await callPromptAPI(asked, framework);

      // 최신이 위로 쌓이도록 앞에 추가
      setResults(prev => [{ id: Date.now(), text: converted, prompt: asked }, ...prev]);

      // 다음 입력을 위해 비우기
      setInputText('');
      setViewState('done');
    } catch (err) {
      console.error(err);
      alert(err.message || '요청 중 오류가 발생했습니다.');
      setViewState('done');
    }
  }, [inputText, selectedFramework]);

  return (
    <div className="app-root" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <NavBar />
      <div style={{ height: 24 }} />

      <main className={`main-section state-${viewState}`}>
        {showIntro && (
          <section className="intro-section">
            <div className="intro-card">
              <img
                src="/slogan.png"
                alt="Prom:Fit — Fit your prompt, Prom:fit"
                className="intro-slogan"
                loading="eager"
                decoding="async"
              />
              <br />
              <p className="intro-desc">좋은 질문이 어느 때보다도 중요해진 시대. 프롬프트와 목적을 입력하세요. </p>
              <p className="intro-desc">단 한 번의 질문으로 완벽한 결과를 얻을 수 있는 프롬프트를 만들어드립니다!</p>
            </div>
          </section>
        )}

        {viewState === 'idle' && (
          <PromptInput
            size="md"
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSubmit}
            // ▼ 기존 options는 폴백용으로만 쓰이므로 전부 false로 둠
            options={{ logical:false, creative:false, academic:false, exploratory:false, reliable:false }}
            // ▼ 새 props: 사용자 프레임워크/현재 선택
            customFrameworks={customFrameworks}
            currentFramework={selectedFramework}
            // PromptInput에서 key 또는 null을 넘겨줌
            onToggleOption={(key) => setSelectedFramework(key)}
          />
        )}

        {viewState === 'loading' && <LoadingSection label="변환 중입니다..." />}

        {viewState === 'done' && (
          <>
            {results.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <ResultSection
                  title="✅변환 완료!"
                  content={results[0].text}
                  onCopy={() => navigator.clipboard.writeText(results[0].text)}
                  question={results[0].prompt}
                />
              </div>
            )}

            <div style={{ height: 16 }} />
            <PromptInput
              size="md"
              value={inputText}
              onChange={setInputText}
              onSubmit={handleSubmit}
              options={{ logical:false, creative:false, academic:false, exploratory:false, reliable:false }}
              customFrameworks={customFrameworks}
              currentFramework={selectedFramework}
              onToggleOption={(key) => setSelectedFramework(key)}
            />

            <div style={{ height: 1, background: '#eee', margin: '24px 0' }} />

            {results.length > 1 && (
              <div className="result-banner" style={{ marginTop: 30, marginBottom: 20 }}>
                📌이전 결과
              </div>
            )}

            {results.slice(1).map((r) => (
              <div key={r.id} style={{ marginBottom: 16 }}>
                <ResultSection
                  title={null}
                  content={r.text}
                  onCopy={() => navigator.clipboard.writeText(r.text)}
                  compact={true}
                />
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
