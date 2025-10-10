// src/components/navBar.js
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Global">
      {/* 좌측: 로고 */}
      <div className="nav-left">
        <img
          src="/logo.png"
          alt="로고"
          className="nav-logo"
        />
      </div>

      <div className="nav-links">
        <Link to="/" className="nav-link">홈</Link>
        <Link to="/library" className="nav-link">둘러보기</Link>
      </div>

      {/* 우측: 액션 */}
      <div className="nav-actions">
        <button type="button" className="btn btn-outline">로그인</button>
        <button type="button" className="btn btn-solid-black">회원가입</button>
      </div>
    </nav>
  );
}
