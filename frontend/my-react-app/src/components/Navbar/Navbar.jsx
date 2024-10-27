import earphoneLogo from '../../assets/earphone.svg'

function Navbar() {
    let icon = earphoneLogo
    return (
      <nav>
        <div>
          <img src={icon}/>
        </div>
      </nav>
    );
  }
  
  export default Navbar;