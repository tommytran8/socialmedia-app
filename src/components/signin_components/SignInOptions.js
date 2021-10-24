// assets
import googlelogo from '../../assets/google.png';

// variables
const logoDimensions = 30;
const googleStr = "Google";

const SignInOptions = ({firebase, auth})=>{

    //TODO 
    //NEED OTHER SIGNIN OPTIONS/ GUEST OPTION

    const handleSignInWithGoogle = () => {
      const provider = new firebase.auth.GoogleAuthProvider(); //google auth popup
      auth.signInWithRedirect(provider);
    }
  
    return (
      <>
        <h4>Sign in with Google</h4>
        <img src={googlelogo} alt={googleStr} width={logoDimensions} height={logoDimensions} onClick={handleSignInWithGoogle}/>
        {/* Sign in out guess here */}
        {/* Sign in with facebook */}
        {/* sign in with email */}
        {/* sign in with twitter */}
      </>
    )
  }

  export default SignInOptions;