import React , {useState, useRef} from 'react';
import './App.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import googlelogo from './assets/google.png';

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

const auth = firebase.auth();
const firestore= firebase.firestore();

const Filter = require('bad-words');

const App = () => {
  const [user] = useAuthState(auth);
  return (
    <div className="App">
      <header>
        {/* <h1>⚛️🔥💬</h1> */}
        <SignOut />
      </header>
      <section>
        {/* if a user is signed in auth */}
        {user ? <MainPage/> : <SignIn/>} 
      </section>
    </div>
  );
}

const SignIn = ()=>{
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider(); //google auth popup
    auth.signInWithRedirect(provider);
  }
  return (
    <>
      <h2>My Social Media App</h2>
      <button onClick={signInWithGoogle}><img src={googlelogo} alt={"Google"} width={50}/>Sign in with Google</button>
    </>
  )
}

const SignOut = () => {
  return auth.currentUser && (
    <button onClick= {() => auth.signOut()}>Sign Out</button>
  )
}

const MainPage = () =>{
  const postsRef = firestore.collection('posts'); // gets collection from database called posts
  const query = postsRef.orderBy('createdAt').limit(25); //orders collection of objects by createdAt key

  const [posts] = useCollectionData(query, {idField: 'id'}); //listens on real-time to data with a hook and gets the collection
  const [formValue, setFormValue] = useState(''); //react's state hook that changes its value real-time
  const dummy = useRef() //react's ref hook, so window will always have refernce in view (to auto-scroll MainPage)

  const filter = new Filter(); //filters out bad words

  const sendpost = async(e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser; //user's google uid and profile image

    await postsRef.add({ //adds new post to collection on firestone
      text: filter.isProfane(formValue) ? filter.clean(formValue) : formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      likes: 0,
      usersLiked: []
    })
    setFormValue(''); //resets MainPage input field

    dummy.current.scrollIntoView({behavior: 'smooth'}); //scroll down
  }

  return (
    <>

      {/* MainPage input */}
      <form onSubmit={sendpost}>
        <input value={formValue} placeholder={`Whats on your mind, ${auth.currentUser.displayName}?`} onChange={(e) => {setFormValue(e.target.value);}}/> {/* bind hook to form input */}
        <button type={"subnit"} disabled={!formValue}>Post</button>
      </form>
      {/* MainPage */}
      <main>
        {posts && posts.reverse().map(msg => <Post key={msg.id} post={msg}/>)}
        <div ref={dummy}></div>
      </main>

      
    </>
  )
}

const Post = (props) => {
  const {text, uid, photoURL, likes, usersLiked} = props.post;

  const postClass = uid === auth.currentUser.uid ? 'posted' : 'received';

  const deletePost = ()=>{
    if (window.confirm("Are you sure you want to delete this post?")){
      firestore.collection("posts").doc(props.post.id).delete()
      .then(()=>{
        console.log(`Deleted post with post: ${text} by ${auth.currentUser.displayName}`)
      })
    }
  }

  const likePost = ()=>{ //WORKING HERE
    if (!usersLiked.includes(uid)){
      usersLiked.push(uid)
      firestore.collection("posts").doc(props.post.id).update({
        likes: firebase.firestore.FieldValue.increment(1),
        usersLiked: usersLiked
      })
    }
    else{
      for (const i in usersLiked){
        if (usersLiked[i] == uid){
          usersLiked.splice(i,1);
          break;
        }
      }
      
      firestore.collection("posts").doc(props.post.id).update({
        likes: firebase.firestore.FieldValue.increment(-1),
        usersLiked: usersLiked
      })
    }
    
  }

  return (
    // different style depending on sent or received className
    <div className={`post ${postClass}`}> 
      <div>
        {uid == auth.currentUser.uid ? <button onClick={deletePost}>{"delete"}</button> : <p></p>}
      </div>
      <p>{auth.currentUser.displayName}</p>
      <img src={photoURL}/>
      <p>{text}</p>
      <button onClick={likePost}>{`likes: ${likes}`}</button>
    </div>
  ) 
}

export default App;