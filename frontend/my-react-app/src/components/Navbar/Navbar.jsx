/*
Artifact(s): N/A
Description: Header to give the site some form. 
Name: Anil Thapa
Date: 10/26/2024
Revised: 11/10/2024 (Add user icon)
Preconditions: N/A
Postconditions: Interface
Error and exception conditions: N/A
Side effects: N/A
*/

import userIcon from '../../assets/usericon.svg'
import earphoneLogo from '../../assets/headphone.svg'
import './Navbar.css'

function Navbar() {
  let icon = earphoneLogo
  return (
    <nav className="navbar">
      <div className="navbar-container">
      <div className="user-container">
          <img src={userIcon} id="user-icon" />
          <span className="username-tooltip">Admin</span>
        </div>
        <img src={icon} id="navbar-logo" />
      </div>
    </nav>
  );
}

export default Navbar;