const SignOut = ({auth}) => {
    const handleSignOut = () => auth.signOut();
    
    return auth.currentUser && (<button id={"sign-out-button"} onClick= {handleSignOut}>Sign Out</button>)
}

export default SignOut;