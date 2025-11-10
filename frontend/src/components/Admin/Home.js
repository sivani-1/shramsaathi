import { useState } from "react";
import "./Home.css";
import Popup from "./Popup";

const Home = () => {
  const [showPopup, setShowPopup] = useState(false);

  const handleOpenPopup = () => setShowPopup(true);
  const handleClosePopup = () => setShowPopup(false);

  const handleWorker = () => {
    alert("Redirect to Worker Login/Register Page");
    setShowPopup(false);
  };

  const handleOwner = () => {
    alert("Redirect to Owner Login/Register Page");
    setShowPopup(false);
  };

  return (
    <div className="home-section">
      <h1>Welcome to Shramsaathi</h1>
      <p>
        A digital bridge connecting skilled workers and employers. Our platform
        empowers carpenters, plumbers, electricians, and other daily-wage
     earners by providing visibility, direct job access, and freedom to
       choose work easily. Join now to find verified workers nearby and explore
       opportunities!
      </p>
      <button className="join-btn" onClick={handleOpenPopup}>
        Join Now
      </button>

      {showPopup && (
        <Popup
          onClose={handleClosePopup}
          onWorker={handleWorker}
          onOwner={handleOwner}
        />
      )}
    </div>
  );
};

export default Home;


