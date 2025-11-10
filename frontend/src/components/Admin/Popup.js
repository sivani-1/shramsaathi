import { useState } from "react";
import OwnerLoginPopup from "./OwnerLoginPopup";
import "./Popup.css";
import WorkerLoginPopup from "./WorkerLoginPopup";
import API from "./api";
const Popup = ({ onClose }) => {
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWorkerLogin, setShowWorkerLogin] = useState(false);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [workType, setWorkType] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [pincode, setPincode] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
   const [age, setAge] = useState("");
  const [experience, setExperience] = useState("");


  
  const handleWorkerSubmit = async (e) => {
  e.preventDefault();

  const workerData = {
    name,
    phone,
    address,
    workType,
    district,
    mandal,
    pincode,
    age,
    experience
  };

  try {
    const res = await API.post("/register/user", workerData);
    const password = res.data.split(": ").pop(); 
    setGeneratedPassword(password);
    setShowSuccess("worker");
  } catch (err) {
    alert(err.response.data);
    console.error(err);
  }
};

 
  const [ownerData, setOwnerData] = useState({
  name: "",
  phone: "",
  address: "",
  businessName: "",
  district: "",
  mandal: "",
  pincode: "",
});


const handleOwnerSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await API.post("/register/owner", ownerData);
    const password = res.data.split(": ").pop();
    setGeneratedPassword(password);
    setShowSuccess("owner");
  } catch (err) {
    alert(err.response.data);
  }
};

  // Show Worker Login Popup
  if (showWorkerLogin) {
    return <WorkerLoginPopup onClose={onClose} />;
  }

  // Show Owner Login Popup
  if (showOwnerLogin) {
    return <OwnerLoginPopup onClose={onClose} />;
  }

  // Success message after registration
  if (showSuccess) {
    return (
      <div className="popup-overlay">
        <div className="popup-box">
          <h2>Registered Successfully!!!</h2>
          <p>
            Your password to login to ShramSaathi is <b>{generatedPassword}</b> <br />Username: <b>{name}</b>
          </p>
          <button
            className="btn-primary"
            onClick={() =>
              showSuccess === "worker"
                ? setShowWorkerLogin(true)
                : setShowOwnerLogin(true)
            }
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Worker Registration Form
  if (showWorkerForm) {
    return (
      <div className="popup-overlay">
        <div className="popup-box form-box">
          <h2>Register Worker</h2>
          <form onSubmit={handleWorkerSubmit}>
            <input
              type="text"
              placeholder="Name"
              required
              onChange={(e) => setName(e.target.value)}
            />
            <input type="tel" placeholder="Phone" required onChange={(e)=>setPhone(e.target.value)} />
            <input type="text" placeholder="Address" required onChange={(e)=>setAddress(e.target.value)} />
            <input type="text" placeholder="Work Type" required onChange={(e)=>setWorkType(e.target.value)} />
            <input type="text" placeholder="District" required onChange={(e)=>setDistrict(e.target.value)} />
            <input type="text" placeholder="Mandal" required onChange={(e)=>setMandal(e.target.value)} />
            <input type="text" placeholder="Pincode" required onChange={(e)=>setPincode(e.target.value)} />
            <input type="number" placeholder="Age" required  onChange={(e)=>setAge(e.target.value)}/>
            <input type="text" placeholder="Experience" required  onChange={(e)=>setExperience(e.target.value)}/>
            <button type="submit" className="btn-primary">
              Submit
            </button>
          <button className="btn-primary" onClick={()=>setShowWorkerLogin(true)}>
            Login
          </button>
          </form>
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // Owner Registration Form
  if (showOwnerForm) {
    return (
      <div className="popup-overlay">
        <div className="popup-box form-box">
          <h2>Register Business Owner</h2>
          <form onSubmit={handleOwnerSubmit}>
            <input
              type="text"
              placeholder="Full Name"
              required
              onChange={(e) => setName(e.target.value)}
            />
            <input type="text" placeholder="Full Name" required onChange={(e)=>setOwnerData({...ownerData, name:e.target.value})}/>
            <input type="tel" placeholder="Phone Number" required onChange={(e)=>setOwnerData({...ownerData, phone:e.target.value})}/>
            <input type="email" placeholder="Email Address" required onChange={(e)=>setOwnerData({...ownerData, address:e.target.value})}/>
            <input type="text" placeholder="Business Name" required onChange={(e)=>setOwnerData({...ownerData, businessName:e.target.value})}/>
            <input type="text" placeholder="District" required onChange={(e)=>setOwnerData({...ownerData, district:e.target.value})}/>
            <input type="text" placeholder="Mandal" required onChange={(e)=>setOwnerData({...ownerData, mandal:e.target.value})}/>
            <input type="text" placeholder="Pincode" required onChange={(e)=>setOwnerData({...ownerData, pincode:e.target.value})}/>
            <button type="submit" className="btn-primary">
            
              Register
            </button>
          <button className="btn-primary" onClick={()=>setShowOwnerLogin(true)}>
            Login
          </button>
          </form>
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // Default role selection popup
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h2>Login or Register</h2>
        <p>Select your role to continue:</p>
        <button className="btn-primary" onClick={() => setShowWorkerForm(true)}>
          Login as Worker
        </button>
        <button className="btn-success" onClick={() => setShowOwnerForm(true)}>
          Login as Owner
        </button>
        <button className="btn-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default Popup;


