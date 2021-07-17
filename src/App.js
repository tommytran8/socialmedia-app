import React , {useState, useRef, useEffect} from 'react';
import './App.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useStorage } from 'react-firebase-hooks/storage';

import googlelogo from './assets/google.png';
import settingsicon from './assets/settings.png';
import likeicon from './assets/like.png'
import smileicon from './assets/smile.png'

import 'emoji-mart/css/emoji-mart.css';
import { Picker } from 'emoji-mart';



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
const storage = firebase.storage();


const Filter = require('bad-words');

const App = () => {
  const [user] = useAuthState(auth);
  return (
    <div className="App">
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
    <div id={"sign-in-page"}>
      <h2>My Social Media App: <u>a slack clone</u></h2>
      
      <h4>Sign in with Google</h4>
      <img src={googlelogo} alt={"Google"} width={30} height={30} onClick={signInWithGoogle}/>
      {/* <button onClick={signInWithGoogle}><img src={googlelogo} alt={"Google"} width={40} height={40}/></button> */}
    </div>
  )
}

const SignOut = () => {
  return auth.currentUser && (
    <button id={"sign-out-button"} onClick= {() => auth.signOut()}>Sign Out</button>
  )
}

const MainPage = () => {

  const { uid, photoURL } = auth.currentUser; //user's google uid and profile image
  const userdataRef = firestore.collection("userdata");
  const [userList] = useCollectionData(userdataRef, {idField: 'id'});

  userdataRef.get().then((users)=>{ //updates userdata document if new user joins
    let check = false;
    for (const u of users.docs) {
      // console.log(u.data().userID)
      if (u.data().userID == uid) {
        check = true; 
        // console.log("user in database", uid)
        break;
      }
    }
    if (!check) {
      // console.log("user NOT in database", uid)
      userdataRef.doc(uid).set({
        numOfPost: 0,
        numOfChannels: 0,
        numOfFiles: 0,
        userID: uid,
        userName: auth.currentUser.displayName,
      })
    }
  })

  const channelsRef = firestore.collection("channels")
  const query = channelsRef.orderBy('createdAt', "desc");
  const [channels] = useCollectionData(query, {idField: 'id'});
  const [defaultChannel] = useCollectionData(query.limit(1), {idField: 'id'});

  // const [mychannels] =  useCollectionData(channelsRef.where("createdBy", "==", uid), {idField: 'id'}); //can be used for search bar to look for all of a user's post
  const userDataRef = firestore.collection("userdata").doc(uid);

  const [currentChannelID, setCurrentChannelID] = useState(null);
  const [currentChannelName, setCurrentChannelName] = useState(null);
  const [userClick, setUserClick] = useState(false);

  const addChannel = async ()=>{
    const channel = prompt("Please enter your channel name", "");
    if (channel.length <= 14) {
      if (channel != "" && channel != null){
        await channelsRef.add({ //adds new channel to channel collection on firestore database
        // await channelsRef.doc(channel).set({ //adds new channel to channel collection on firestore database
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: uid,
          channelName: channel,
          users: [uid]
        })
        await userDataRef.update({
          numOfChannels: firebase.firestore.FieldValue.increment(1), 
        })
      }
    }
    else {
      alert("Please keep channel name within 14 or less characters");
    }
  }

  const checkSubmit = async ()=>{
    await userDataRef.get().then((user)=>{
      if(user.exists){
        user.data().numOfChannels < 3 ? addChannel() : alert("A user cannot create more than 3 channels")
      }
    })
  }
 
  const channelOwner = async ()=>{
    if (currentChannelID) {
      await channelsRef.doc(currentChannelID).get().then((ch)=>{
        // console.log(ch.data().createdBy, uid)
        if (ch.data().createdBy === uid) deleteChannel(currentChannelID)
        else alert("You're not the channel owner!")
        
      })
    }
    else {
      await query.limit(1).get().then((ch)=> {
        // console.log(ch.docs[0].data().createdBy === uid)
        if (ch.docs[0].data().createdBy === uid) deleteChannel(ch.docs[0].id)
        else alert("You're not the channel owner!")
      })
    }
  }
  const deleteChannel = async (currentChannelID)=>{ 
    if (window.confirm("Deleting channel, Click ok to confirm, cancel to cancel")){
      if (window.confirm("This action is irreversible, Are you sure?")){
        // await channelsRef.doc(currentChannelID).get().then((ch)=>{
        //   console.log(ch.data()); // WORK HERE: 07/10/21
        // })
        console.log("Not yet implemented");
      }
    }
  }

  const handleUserClick = ()=>{
    setUserClick(!userClick);
  }

  return (
    <div id={"home-page"}>
      <nav>
        <div>
          <div id={"nav-user"} onClick={handleUserClick}>
            <img src={auth.currentUser.photoURL} height={40}></img>
            <p>{auth.currentUser.displayName}</p>
            <svg id={"user-svg"} className={userClick ? "user-click-on" : "user-click-off"} width="43" height="30" viewBox="0 0 43 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.3652 29.2383L0.710938 8.4082L8.35742 0.761719L21.3652 13.7695L34.4609 0.761719L42.1074 8.4082L21.3652 29.2383Z" fill="white"/>
            </svg>
          </div>
        
          {userClick ? 
          <div id={"SignOut"}>
            <SignOut/>
          </div> :
          <>
            <div id={"nav-channels-header"}>
              <h2>{"Channels: "}</h2>
              <button onClick={checkSubmit}>+</button> 
              <button onClick={channelOwner}>-</button>
            </div>

            <div id={"nav-channels-body"}>
            {channels && channels.map(channel=>{
              return <div className={"nav-channel-names"}> <button key={channel.channelName} 
                            onClick={()=> {setCurrentChannelID(channel.id); setCurrentChannelName(channel.channelName)}}>{channel.channelName} <div></div></button>
                            </div>
            })}
            </div>
            {/* <div id={"user-header"}>
              <h2>{"Users Online: "}</h2>
              {userList && userList.map((user)=>{return <div style={user.userName == auth.currentUser.displayName ? {
                                                            display: "flex"
                                                            }: {}}>
                                                          <p>{user.userName}</p> 
                                                          <div></div>
                                                        </div>})}
            </div> */}
            
          </>
          }
          
        </div>
      </nav>
      
      {defaultChannel && defaultChannel.map(channel=>{
        return <Channel key={currentChannelName ? currentChannelName : channel.channelName} 
                        channelID={currentChannelID ? currentChannelID : channel.id}
                        channelName={currentChannelName ? currentChannelName : channel.channelName}></Channel>
      })}
    </div>
  )
}
 
const Channel = (props) =>{
  const { uid, photoURL } = auth.currentUser; //user's google uid and profile image
  const [maxPost, setMaxPost] = useState(5); // used in posts, only display 5 post at a time
  const increasePost = 20; //increase number of post displayed, 20 increments at a time
  const maxMessageLength = 100;

  const postsRef = firestore.collection(props.channelID); // gets collection from database called posts
  const query = postsRef.orderBy('createdAt', "desc").limit(maxPost); //orders collection of objects by createdAt key
  const userDataRef = firestore.collection("userdata").doc(uid);

  const [posts] = useCollectionData(query, {idField: 'id'}); //listens on real-time to data with a hook and gets the collection
  const [formValue, setFormValue] = useState(''); //react's state hook that changes its value real-time
  const [emoji, setEmojiPicker] = useState(false);
  const [fileT, setFile] = useState(null);
  const [fileButton, setFileButton] = useState(false); //disables add_reply, upload_media, and delete_button(s) 
  const [fileURL, setFileURL] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState(null);

  // const [latestPost, setLatestPost] = useState(true); //allows load more messages to work
  const [progressBar, setProgressBar] = useState(false); //progress bar on upload

  const dummy = useRef() //react's ref hook, so window will always have refernce in view (to auto-scroll in channel display)

  const filter = new Filter(); //filters out bad words

  const sendpost = async(e) => {
    if (formValue.length <= maxMessageLength) {
      setFileButton(true); //disables buttons
    
      await postsRef.add({ //adds new post to collection on firestone
        text: filter.isProfane(formValue) ? filter.clean(formValue) : formValue,
        fileURL: fileURL, //uses temp url until new one is created
        fileName: fileName,
        fileType: fileType,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid, //google uid of user that made post
        photoURL,
        displayName: auth.currentUser.displayName,
        likes: 0,
        usersLiked: []
      })
      .then(async (post)=>{
        // console.log(`Post id: ${post.id}`);
        // console.log(fileT);
        if (fileT){
          const storageRef = storage.ref(`${uid}/${post.id}`);
          const upload = storageRef.put(fileT);
          upload.on('state_changed', 
            (snapshot) => {
              // Observe state change events such as progress, pause, and resume
              // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
              let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(progress);
            }, 
            (error) => {
              // Handle unsuccessful uploads
            }, 
            () => {
              // Handle successful uploads on complete
              upload.snapshot.ref.getDownloadURL().then((downloadURL) => {
                console.log('File available at', downloadURL);
                setFileButton(false); //enable buttons
                post.update({
                  fileURL: downloadURL
                })
                .then(() => {
                    console.log("Document successfully updated!");
                })
                .catch((error) => {
                    // The document probably doesn't exist.
                    console.error("Error updating document: ", error);
                });

              })
            }
          );
          await userDataRef.update({
            numOfFiles: firebase.firestore.FieldValue.increment(1), 
          })
        }
        else {
          setFileButton(false); //enable buttons
        }
      })
      await userDataRef.update({
        numOfPost: firebase.firestore.FieldValue.increment(1), 
      })

      document.getElementById("img").src = '';
      document.getElementById("img").height = 0;
      document.getElementById("link").href = '';
      document.getElementById("link").innerText = '';

      setFormValue(''); //resets user input field
      setEmojiPicker(false);
      setFile(null);
      setFileURL(null);
      setFileName(null);
      setFileType(null);
      

      dummy.current.scrollIntoView({behavior: 'smooth'}); //scroll down
    }
    else {
      alert(`Messages at most can only have ${maxMessageLength} characters`)
    }
  }

  const addEmoji = (e)=>{
    setFormValue(`${formValue}${e.native}`);
    setEmojiPicker(false);
  }
  const toggleEmojiPicker = (e)=>{
    e.preventDefault();
    setEmojiPicker(!emoji);
  }

  const checkSubmit = async (e)=>{
    e.preventDefault();
    await userDataRef.get().then((user)=>{
      if(user.exists){
        user.data().numOfPost < 100 ? sendpost() : alert("A user cannot create more than 100 posts")
      }
    })
    
  }

  const uploadFile = (e)=>{
    const file = e.target.files[0]; 
    // console.log(file.type);
    if (file && (file.type.startsWith("image") || file.type.includes("pdf"))) { // checks if user chooses a file
      setFile(file);
      const storageRef = storage.ref(`${uid}/${"temp"}`);
      const upload = storageRef.put(file);
      setFileButton(true);
      setProgressBar(true)

      upload.on('state_changed', 
        (snapshot) => {
          // Observe state change events such as progress, pause, and resume
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          document.getElementById("file_progress").value = progress;
        }, 
        (error) => {
          // Handle unsuccessful uploads
        }, 
        () => {
          // Handle successful uploads on complete
          upload.snapshot.ref.getDownloadURL().then((downloadURL) => {
            console.log('File available at', downloadURL);
            setFileButton(false);
            setProgressBar(false);
            if (file.type.startsWith("image")) {
              const loadedfile = document.getElementById("img");
              loadedfile.src = downloadURL;
              loadedfile.height = 250;

              document.getElementById("link").href = '';
              document.getElementById("link").innerText = '';
            }
            else {
              const loadedfile = document.getElementById("link");
              loadedfile.href = downloadURL;
              loadedfile.innerText = file.name;

              document.getElementById("img").src = '';
              document.getElementById("img").height = 0;
            }
            setFileURL(downloadURL);
            setFileName(file.name);
            setFileType(file.type);
            e.target.value = '';
            dummy.current.scrollIntoView({behavior: 'smooth'}); //scroll down
          })
        }
      );
    }
  }

  // const loadMorePost = ()=>{
  //   postsRef.orderBy('createdAt', "desc").limit(maxPost + increasePost).get()
  //   .then((p)=>{
  //     setLatestPost(p.docs[maxPost + increasePost - 1].data().createdAt);
  //   })
  //   .catch((error)=>{
  //     console.log("All post are loaded")
  //     setLatestPost(false);
  //   })
  //   setMaxPost(maxPost + increasePost);
  // }

  const handleScroll = (e)=>{
    const estimatePadding = 10;
    if (e.target.scrollHeight +  Math.floor(e.target.scrollTop) - estimatePadding <= e.target.clientHeight){
      // if (latestPost) { 
      //   setLatestPost(false);
      //   postsRef.orderBy('createdAt', "desc").limit(maxPost + increasePost).get()
      //   .then((p)=>{
      //     setLatestPost(p.docs[maxPost + increasePost - 1].data().createdAt);
      //   })
      //   .catch((error)=>{
      //     console.log("All post are loaded")
      //     setLatestPost(false);
      //   })
      //   setMaxPost(maxPost + increasePost);
      // }
      if (posts && posts.length >= maxPost) {
        setMaxPost(maxPost + increasePost);
      }
    }
  }
  
  // useEffect(()=>{
  //   document.title = posts ? `Num Post: ${posts.length}` : "Social Media";
  // })

  return (
    <div id={"main-display"} onClick={()=>{if (emoji) setEmojiPicker(false); }}>
      {/* channel display */}
      <main id={"channel-display"} onScroll={handleScroll}>
        <div ref={dummy}></div>
        { fileT || formValue ? <div id={"temp-message"}>
          <p>{formValue}</p>
          <a id="link" target="_blank"></a>
          <img id="img" height="0" src=""></img>  
          {fileT ? <button onClick={()=>{
            setFile(null);
            setFileURL(null);
            setFileName(null);
            setFileType(null);
            document.getElementById("img").src = "";  
            document.getElementById("img").height = 0; 
            document.getElementById("link").href = ""; 
            document.getElementById("link").innerText = ''}}>x</button> : <></>}
        </div>
        : <></>}
        {posts && posts.map(post => <Post key={post.id} post={post} channel={props.channelID} disable={fileButton} />)}
        
        {/* load more button */}        
        {/* <button id="load-post" style={{display: 'none'}} onClick={loadMorePost}>load more messages</button>         */}
      </main>


      {/* channel display input */}
      <section id={"user-input"}>
      
        <form onSubmit={checkSubmit}>
          {/* user reply */}
          
          <div id={"message"}>
            
            <input id={"inp"} value={formValue} placeholder={`What's on your mind, ${auth.currentUser.displayName}?`} 
                  onClick={()=>{dummy.current.scrollIntoView({behavior: 'smooth'})}} 
                  onChange={(e) => { if (formValue.length < maxMessageLength ) setFormValue(e.target.value) 
                                    else if (formValue.length >= maxMessageLength && e.target.value.length == formValue.length - 1) {setFormValue(e.target.value) }
                                    
                  }} 
                  onKeyPress={(e)=>{ if (e.key === "Enter") { e.preventDefault(); document.getElementById("add_reply").click()}
                  }} /> {/* bind hook to form input */}
            <div>
              {emoji ? <Picker style={{position: "absolute", right: "0", transform: "translateX(-20px) translateY(-101%)"}} onSelect={addEmoji} /> : <></>}
              <button onClick={toggleEmojiPicker}><img src={smileicon} height={25} width={25}></img></button>
              <p>{`${formValue.length}/${maxMessageLength}`}</p>  
            </div>
            
          </div>
          
          <button id="add_reply" type={"submit"} disabled={ fileButton || (!formValue && fileURL == null) }>Add Reply</button>

          {/* file upload */}
          <button id="upload-media" disabled={fileButton} 
                  onClick={(e)=>{e.preventDefault(); 
                                dummy.current.scrollIntoView({behavior: 'smooth'}); 
                                document.getElementById("file").click() }}>Upload Media</button> 
          
          <input id="file" type={"file"} onChange={async (e)=>{
            await userDataRef.get().then((user)=>{
              if(user.exists){
                if (user.data().numOfFiles < 10) uploadFile(e);
                else {
                  e.target.value = '';
                  alert("A user cannot upload more than 10 files");
                }
              }
            })
            
          }} style={{display: 'none'}}>
          </input>
          {progressBar ? <progress id="file_progress" value="0" max= "100" ></progress> : <></>}
        </form>

        {/* select emoji */}
        
      </section>
      
    </div>
  )
}

const Post = (props) => {
  const {text, fileURL, fileName, fileType, uid, photoURL, displayName, likes, usersLiked} = props.post;
  const userDataRef = firestore.collection("userdata").doc(uid);

  const postClass = uid === auth.currentUser.uid ? 'posted' : 'received';
  
  const deletePost = async ()=>{
    if (window.confirm("Are you sure you want to delete this post?")){
      //deletes post from firestore database
      await firestore.collection(props.channel).doc(props.post.id).delete()
      .then(()=>{
        console.log(`Deleted post with post: ${text} by ${auth.currentUser.displayName}`)
        userDataRef.update({
          numOfPost: firebase.firestore.FieldValue.increment(-1), 
        })
      })

      //deletes file attached to post from firebase storage
      const storageRef = storage.ref(`${uid}/${props.post.id}`);
      await storageRef.delete().then(() => {
        console.log(`Deleted file attached to post: ${text} by ${auth.currentUser.displayName}`)
        userDataRef.update({
          numOfFiles: firebase.firestore.FieldValue.increment(-1), 
        })
      }).catch((error) => {
        console.log("File does not exist");
      });
      
    }
  }
  const likePost = ()=>{
    //if user have not liked post yet
    if (!usersLiked.includes(auth.currentUser.uid)){
      return firestore.collection(props.channel).doc(props.post.id).update({
        likes: firebase.firestore.FieldValue.increment(1), // likes: likes + 1,
        usersLiked: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid) // usersLiked.push(auth.currentUser.uid);
      })
      .then (()=>{
        console.log(`Post liked by ${auth.currentUser.displayName}`)
      })
      .catch((error)=>{
        console.error("Error liking the post: ", error);
      })
    }
    //user already liked post
    else {
      return firestore.collection(props.channel).doc(props.post.id).update({
        likes: firebase.firestore.FieldValue.increment(-1), // likes: likes - 1,
        usersLiked: firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid)
      })
      .then (()=>{
        console.log(`Post unliked by ${auth.currentUser.displayName}`)
      })
      .catch((error)=>{
        console.error("Error liking the post: ", error);
      })
    }
  }

  const [checkDelete, setCheckDelete] = useState(false);
  const handlePostSettings = ()=>{
    setCheckDelete(!checkDelete)
  }
  return (
    // different style depending on sent or received className
    <div className={`post ${postClass}`} > 
      <img height={"50"} src={photoURL}/>
      <div>
        <p>{displayName}</p>
        <p>{text}</p>
        {fileURL ? fileType.startsWith("image") ? <img src={fileURL} height="250"></img> : <a href={fileURL} target="_blank">{fileName}</a> : <></>}
        <hr></hr>
        <button className={"like_button"} onClick={likePost}><img src={likeicon} height={20}></img> {likes}</button>
   
      </div>

      <div>
        {/* only display delete on Post objects that belong to current user */}
        {uid == auth.currentUser.uid ? <img src={settingsicon} height={25} width={25} onClick={handlePostSettings}></img> : <></>}
        {checkDelete ? <button className={"delete_button"} disabled={props.disable} onClick={deletePost}>{"delete"}</button>: <></>}
      </div>
  </div>
  ) 
}



export default App;