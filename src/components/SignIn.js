import SignInDisplay from "./signin_components/SignInDisplay"
import SignInOptions from "./signin_components/SignInOptions";

const SignIn = ({firebase, auth})=>{

  return (
    <div id={"sign-in-page"}>
      <SignInDisplay/>
      <SignInOptions firebase={firebase} auth={auth}/>
    </div>
  )
}

export default SignIn;