import { useNavigate } from "react-router-dom";

const Topbar = () => {
  const navigate = useNavigate();

  return (
    <header>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Dashboard</h1>
        </div>
        <div className="topbar-right">
          <button
            onClick={() => navigate("/dashboard/help-support")}
            className="btn"
            aria-label="Help & Support"
          >
            Help & Support
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;