/*
Artifact(s): N/A
Description: Header to give the site some form. 
Name: Anil Thapa
Date: 10/26/2024
Revised: N/A
Preconditions: N/A
Postconditions: Interface
Error and exception conditions: N/A
Side effects: N/A
*/

import earphoneLogo from '../../assets/earphone.svg'
import './Navbar.css'

function Navbar() {
  let icon = earphoneLogo
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <img src={icon} id="navbar-logo" />
      </div>
    </nav>
  );
}

export default Navbar;