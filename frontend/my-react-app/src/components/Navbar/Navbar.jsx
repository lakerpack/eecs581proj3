/*
Artifact(s): N/A
Description: Header to give the site some form. 
Name: Anil Thapa
Date: 10/26/2024
Revised: 11/10/2024 (Add user icon)
Revised: 11/24/2024 (Add user interface icon and logout button)
Preconditions: N/A
Postconditions: Interface
Error and exception conditions: N/A
Side effects: N/A
*/

import earphoneLogo from '../../assets/earphone.svg'
import './Navbar.css'
import { useAuth } from '../Auth/Auth'
import { useState } from 'react'
import { ProfileModal } from '../Auth/ProfileModal'

import defaultProfile from "../../assets/defaultProfile.svg"

/*
When creating the Navbar component, we define the necessary variables to manage the navigation bar state.
These variables will control the profile modal visibility and handle user-related displays.
logout/user -- authentication state and functions from AuthContext
isProfileOpen -- controls the visibility of the profile editing modal
useDefaultImage -- manages fallback state for profile image loading failures
*/
function Navbar() {
    const { logout, user } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [useDefaultImage, setUseDefaultImage] = useState(false);

    function getProfileImageUrl(imagePath) {
        if (!imagePath) return defaultProfile;

        if (imagePath.startsWith('http')) return imagePath;

        const filename = imagePath.split('\\').pop().split('/').pop();
        return `http://127.0.0.1:5000/profile_images/${filename}`;
    }

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="navbar-profile">
                    <img src={useDefaultImage ? defaultProfile : getProfileImageUrl(user?.profile_image)}
                        onError={() => setUseDefaultImage(true)} />
                    <span>{user?.name || user?.username}</span>
                </button>
                <div className="comp">
                    <button onClick={logout} className="navbar-logout"> Logout </button>
                    <img src={earphoneLogo} id="navbar-logo" />
                </div>
            </div>
            {isProfileOpen && (
                <div className="profile-modal-container">
                    <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
                </div>
            )}
        </nav>
    );
}

export default Navbar;