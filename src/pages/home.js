// src/pages/home.js
import React, { useMemo, useState, useCallback } from 'react';
import NavBar from '../components/navBar';
import PromptInput from '../components/PromptInput';
import LoadingSection from '../components/LoadingSection';
import ResultSection from '../components/ResultSection';
import './home.css';

// ▼ 옵션 → 프레임워크 매핑
function optionToFramework(options) {
  if (options?.reliable)   return 'RTF';
  if (options?.logical)    return 'TAG';
  if (options?.exploratory)return 'BAB';
  if (options?.academic)   return 'CARE';
  if (options?.creative)   return 'CO_STAR';
  return 'TAG'; // 미선택 디폴트
}

// ▼ 백엔드 호출
async function callPromptAPI(prompt, framework) {
  const API_URL = 'https://jodee-unlapped-rachal.ngrok-free.dev/api/prompt';

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
  const [options, setOptions] = useState({
    logical: false,
    creative: false,
    academic: false,
    exploratory: false,
    reliable: false,
  });

  const showIntro = useMemo(() => viewState === 'idle', [viewState]);

  // 제출(엔터/버튼) → loading → done
  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;
    setViewState('loading');

    const asked = inputText;                 // 당시 질문 보존
    const framework = optionToFramework(options);

    try {
      const converted = await callPromptAPI(asked, framework);

      // 최신이 위로 쌓이도록 앞에 추가
      setResults(prev => [{ id: Date.now(), text: converted, prompt: asked }, ...prev]);

      // 다음 입력을 위해 비우기
      setInputText('');
      setViewState('done');
    } catch (err) {
      console.error(err);
      // 필요 시 에러 UI로 바꿔도 됨
      alert(err.message || '요청 중 오류가 발생했습니다.');
      setViewState('done');
    }
  }, [inputText, options]);

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
            options={options}
            onToggleOption={(key) =>
              setOptions(() => key == null
                ? { logical:false, creative:false, academic:false, exploratory:false, reliable:false }
                : {
                    logical: key === 'logical',
                    creative: key === 'creative',
                    academic: key === 'academic',
                    exploratory: key === 'exploratory',
                    reliable: key === 'reliable',
                  })
            }
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
              options={options}
              onToggleOption={(key) =>
                setOptions(() => key == null
                  ? { logical:false, creative:false, academic:false, exploratory:false, reliable:false }
                  : {
                      logical: key === 'logical',
                      creative: key === 'creative',
                      academic: key === 'academic',
                      exploratory: key === 'exploratory',
                      reliable: key === 'reliable',
                    })
              }
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
