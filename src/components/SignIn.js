const SignIn = ()=>{
    const signInWithGoogle = () => {
      const provider = new firebase.auth.GoogleAuthProvider(); //google auth popup
      auth.signInWithRedirect(provider);
    }
    return (
      <div id={"sign-in-page"}>
        <h2>My Social Media App: <u>a slack clone</u></h2>
        
        <h4>Sign in with Google</h4>
        <img src={googlelogo} alt={"Google"} width={30} height={30} onClick={signInWithGoogle}/>
        {/* <button onClick={signInWithGoogle}><img src={googlelogo} alt={"Google"} width={40} height={40}/></button> */}
      </div>
    )
}
export default SignIn;