// src/components/PromptInput.jsx
import React, { useRef, useEffect } from 'react';

export default function PromptInput({
  size = 'md',
  value,
  onChange,
  onFocus,
  onSubmit,
  options,
  onToggleOption,
}) {
  const isLarge = size === 'lg';

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onSubmit?.();
  };

  const toggle = (key, isSelected) => {
    // 이미 선택돼 있으면 해제(null 전달), 아니면 해당 key 선택
    onToggleOption?.(isSelected ? null : key);
  };

  // ▼ 자동 높이 조절을 위한 ref 및 함수
  const taRef = useRef(null);
  const autoResize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';                    // 리셋
    el.style.height = `${el.scrollHeight}px`;    // 내용에 맞게 확장
  };

  // 입력 시: 원래 onChange 호출 + 높이 자동 조절
  const handleChange = (e) => {
    onChange?.(e.target.value);
    // setState 이후 렌더 전이므로, 다음 프레임에 반영되도록 requestAnimationFrame
    requestAnimationFrame(autoResize);
  };

  // 외부에서 value가 바뀌는 경우(초기 로드, reset 등)도 반영
  useEffect(() => {
    autoResize();
  }, [value]);

  // 초기 마운트 시 최소 높이 세팅
  useEffect(() => {
    autoResize();
  }, []);

  return (
    <section className={`prompt-wrap ${isLarge ? 'lg' : 'md'}`}>
      <div className="panel">
        <textarea
          ref={taRef}
          className="prompt-textarea"
          placeholder="텍스트 필드"
          value={value}
          onChange={handleChange}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          rows={isLarge ? 7 : 4}
        />
        <div className="submit-side">
          <button className="primary-btn" onClick={onSubmit}>입력</button>
        </div>
      </div>

      {/* 세부 기능 섹션 */}
      <div className="options-bar" role="group" aria-label="부가기능 선택">
        <div className="options-head">
          <span className="options-title">원하는 세부 기능을 선택하세요!</span>
        </div>

        <div className="options-grid" role="radiogroup" aria-label="단일 선택">
          <label className="radio-chip">
            <input
              type="radio"
              name="prompt-option"
              checked={options.logical}
              readOnly                 // ← 네이티브 상태변경 차단 (경쟁 제거)
              onClick={() => toggle('logical', options.logical)}  // ← 클릭으로만 토글 가능
            />
            <span>논리적</span>
          </label>

          <label className="radio-chip">
            <input
              type="radio"
              name="prompt-option"
              checked={options.creative}
              readOnly                 // ← 네이티브 상태변경 차단 (경쟁 제거)
              onClick={() => toggle('creative', options.creative)}  // ← 클릭으로만 토글 가능
            />
            <span>창의적</span>
          </label>

          <label className="radio-chip">
            <input
              type="radio"
              name="prompt-option"
              checked={options.academic}
              readOnly                 // ← 네이티브 상태변경 차단 (경쟁 제거)
              onClick={() => toggle('academic', options.academic)}  // ← 클릭으로만 토글 가능
            />
            <span>학술적</span>
          </label>

          <label className="radio-chip">
            <input
              type="radio"
              name="prompt-option"
              checked={options.exploratory}
              readOnly                 // ← 네이티브 상태변경 차단 (경쟁 제거)
              onClick={() => toggle('exploratory', options.exploratory)}  // ← 클릭으로만 토글 가능
            />
            <span>탐색적</span>
          </label>

          <label className="radio-chip">
            <input
              type="radio"
              name="prompt-option"
              checked={options.reliable}
              readOnly                 // ← 네이티브 상태변경 차단 (경쟁 제거)
              onClick={() => toggle('reliable', options.reliable)}  // ← 클릭으로만 토글 가능
            />
            <span>신뢰적</span>
          </label>
        </div>
      </div>
    </section>
  );
}
