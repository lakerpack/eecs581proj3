import earphoneLogo from '../../assets/earphone.svg'
import './Navbar.css'

function Navbar() {
    let icon = earphoneLogo
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <img src={icon} id="navbar-logo"/>
        </div>
      </nav>
    );
  }
  
  export default Navbar;