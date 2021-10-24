import './App.css';

// firebase
import firebase from 'firebase/app';
// import { getAnalytics } from "firebase/analytics";
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';
import 'firebase/database';

// react firebase hooks
import { useAuthState } from 'react-firebase-hooks/auth';

// components
import SignIn from './components/SignIn';
import MainPage from './components/MainPage';

const {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
} = require("./env.json");

firebase.initializeApp({
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId
});

// const analytics = getAnalytics(app);

const auth = firebase.auth();
const firestore= firebase.firestore();
const storage = firebase.storage();
const database = firebase.database();


const App = () => {
  const [user] = useAuthState(auth);
  return (
    <div className="App">
      <section>
        {/* if a user is signed in auth */}
        {user ? <MainPage firebase= {firebase} auth={auth} firestore={firestore} storage={storage} database={database}/> : 
                <SignIn firebase={firebase} auth={auth}/>} 
      </section>
    </div>
  );
}

export default App;