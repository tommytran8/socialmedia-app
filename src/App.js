import React , {useState, useRef} from 'react';
import './App.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useStorage } from 'react-firebase-hooks/storage';

import googlelogo from './assets/google.png';

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
      <header>
        <SignOut />
      </header>
      <section>
        {/* if a user is signed in auth */}
        {user ? <HomePage/> : <SignIn/>} 
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

const HomePage = () => {
  const { uid, photoURL } = auth.currentUser; //user's google uid and profile image
  const channelsRef = firestore.collection("channels")
  const query = channelsRef.orderBy('createdAt', "desc");
  const [channels] = useCollectionData(query, {idField: 'id'});
  const [defaultChannel] = useCollectionData(query.limit(1), {idField: 'id'});

  // const [mychannels] =  useCollectionData(channelsRef.where("createdBy", "==", uid), {idField: 'id'}); //can be used for search bar to look for all of a user's post
  const userDataRef = firestore.collection("userdata").doc(uid);

  const [currentChannelID, setCurrentChannelID] = useState(null);
  const [currentChannelName, setCurrentChannelName] = useState(null);

  const addChannel = async ()=>{
    const channel = prompt("Please enter your channel name", "");
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

  const checkUser = async ()=>{
    await userDataRef.get().then((user)=>{
      if(user.exists){
        user.data().numOfChannels < 3 ? addChannel() : alert("A user cannot create more than 3 channels")
      }
    })
  }

  // WORKING HERE 07/03/21 on deleting channels, afterwards work on UI
  // const chan =query.limit(1)
  // const deleteChannel = async ()=>{
    
  //   await chan.get().then((ch)=> {
  //     channelsRef.doc(currentChannelID ? currentChannelID : ch.id).get().then((c)=>{
  //       console.log(c.data())
  //     })
  //   })
  // }

  return (
    <>
      <nav>
        <button onClick={checkUser}>+</button> 
        {/* <button onClick={deleteChannel}>-</button> */}
        
        {channels && channels.map(channel=>{
          return <button key={channel.channelName} 
                         onClick={()=> {setCurrentChannelID(channel.id); setCurrentChannelName(channel.channelName)}}>{channel.channelName}</button>
        })}
      </nav>
      
      {defaultChannel && defaultChannel.map(channel=>{
        return <Channel key={currentChannelName ? currentChannelName : channel.channelName} 
                        channelID={currentChannelID ? currentChannelID : channel.id}
                        channelName={currentChannelName ? currentChannelName : channel.channelName}></Channel>
      })}
      {/* {currentChannel ? <Channel channel={currentChannel}></Channel> : <>{"Select a channel to join"}</>} */}
    </>
  )
}
 
const Channel = (props) =>{
  const { uid, photoURL } = auth.currentUser; //user's google uid and profile image
  const maxPost = 5; // used in posts, only display 5 post at a time
  const postsRef = firestore.collection(props.channelID); // gets collection from database called posts
  const query = postsRef.orderBy('createdAt', "desc").limit(maxPost); //orders collection of objects by createdAt key
  const userDataRef = firestore.collection("userdata").doc(uid);

  const [posts] = useCollectionData(query, {idField: 'id'}); //listens on real-time to data with a hook and gets the collection
  const [formValue, setFormValue] = useState(''); //react's state hook that changes its value real-time
  const [emoji, setEmojiPicker] = useState(false);
  const [fileT, setFile] = useState(null);
  const [fileButton, setFileButton] = useState(false);
  const [fileURL, setFileURL] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState(null);
  // const dummy = useRef() //react's ref hook, so window will always have refernce in view (to auto-scroll MainPage)

  const filter = new Filter(); //filters out bad words

  const sendpost = async(e) => {

    // setFileButton(true);
    // document.getElementById("add_reply").disabled = true;
    /* 10. problem where file will not upload correctly if user (refreshes page/delete post/upload new file) before upload is complete*/

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
        // setFileButton(true);
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
              // setFileButton(false);
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
    })
    await userDataRef.update({
      numOfPost: firebase.firestore.FieldValue.increment(1), 
    })
    setFormValue(''); //resets MainPage input field
    setFileButton(false);
    setEmojiPicker(false);
    setFile(null);
    setFileURL(null);
    setFileName(null);
    setFileType(null);
    document.getElementById("img").src = '';
    document.getElementById("img").height = 0;
    document.getElementById("link").href = '';
    document.getElementById("link").innerText = '';

    // dummy.current.scrollIntoView({behavior: 'smooth'}); //scroll down
  }

  const addEmoji = (e)=>{
    setFormValue(`${formValue}${e.native}`);
  }
  const toggleEmojiPicker = (e)=>{
    e.preventDefault();
    setEmojiPicker(!emoji);
  }

  const checkUser = async (e)=>{
    e.preventDefault();
    await userDataRef.get().then((user)=>{
      if(user.exists){
        user.data().numOfPost < 100 ? sendpost() : alert("A user cannot create more than 100 posts")
      }
    })
    
  }

  const uploadFile = (e)=>{
    const file = e.target.files[0]; 
    if (file && !file.type.startsWith("video") && !file.type.startsWith("audio") && !file.type.includes("MP3" || "MP4")) { // checks if user chooses a file and prevents video/audio upload
      setFile(file);
      const storageRef = storage.ref(`${uid}/${"temp"}`);
      const upload = storageRef.put(file);
      setFileButton(true);

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
            if (file.type.startsWith("image")) {
              const loadedfile = document.getElementById("img");
              loadedfile.src = downloadURL;
              loadedfile.height = 250;
            }
            else {
              const loadedfile = document.getElementById("link");
              loadedfile.href = downloadURL;
              loadedfile.innerText = file.name;
            }
            setFileURL(downloadURL);
            setFileName(file.name);
            setFileType(file.type);
            e.target.value = '';
          })
        }
      );
    }
  }

  return (
    <>
      {/* MainPage input */}
      <section>
        
        <form onSubmit={checkUser}>
          {/* user reply */}
          <button onClick={toggleEmojiPicker}  >:)</button>
          <input value={formValue} placeholder={`Whats on your mind, ${auth.currentUser.displayName}?`} onChange={(e) => {setFormValue(e.target.value);}} onKeyPress={(e)=>{ if (e.key === "Enter") { e.preventDefault(); document.getElementById("add_reply").click() }}} /> {/* bind hook to form input */}
          <a id="link" target="_blank"></a>
          <img id="img" height="0" src=""></img>
          <button id="add_reply" type={"submit"} disabled={ fileButton || (!formValue && fileURL == null) }>Add Reply</button>

          {/* file upload */}
          <button disabled={fileButton} onClick={(e)=>{e.preventDefault(); document.getElementById("file").click() }}>Upload Media</button> {/* WORK HERE 06/26/21 : 
                                                                                                               DONE   1. NEED set it so that Upload Media immediately lets you choose file without using Choose File input. Upload Media should also be a paper clip like modern apps.
                                                                                                               DONE   2. Also need to fix some permission issues that sometimes causes app to not show images/files saved on firebase storage server
                                                                                                               DONE   3. MAYBE also delete images off of server when user deletes post
                                                                                                               DONE   4. MAYBE also have unique names for each image so it doesnt affect images with same file names
                                                                                                               DONE   5. Work on channels / profiles (Add channels for different forum discussions)
                                                                                                                      6. UI
                                                                                                               DONE   7.1. Limit amount of post per user (1000) 
                                                                                                               DONE   7.3. Limit amount of files per user (10)
                                                                                                               DONE   7.2. Limit amount of channel per user (3)
                                                                                                                      8. Load more post button => loads more than 5 post
                                                                                                                      9. search bar
                                                                                                                      10. problem where file will not upload correctly if user (refreshes page/delete post/upload new file) before upload is complete, 
                                                                                                                          but refresh pages will prob be fine when its up on server, just need to prevent user from deleting posting and uploading new file as post loads*/}
          
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
          {fileButton ? <progress id="file_progress" value="0" max= "100" ></progress> : <></>}
        </form>

        {/* select emoji */}
        {emoji ? <Picker onSelect={addEmoji} /> : <></>}
      </section>
      
      {/* MainPage */}
      <main>
        {posts && posts.map(post => <Post key={post.id} post={post} channel={props.channelID}/>)}
        {/* need a load more button */}

        {/* <div ref={dummy}></div> */}
      </main>

      
    </>
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

  return (
    // different style depending on sent or received className
    <div className={`post ${postClass}`}> 
      <div>
        {/* only display delete on Post objects that belong to current user */}
        {uid == auth.currentUser.uid ? <button onClick={deletePost}>{"delete"}</button> : <p></p>} 
      </div>
      <p>{displayName}</p>
      <img src={photoURL}/>
      <p>{text}</p>
      {fileURL ? fileType.startsWith("image") ? <img src={fileURL} height="250"></img> : <a href={fileURL} target="_blank">{fileName}</a> : <></>}
      <button onClick={likePost}>{`likes: ${likes}`}</button>
    </div>
  ) 
}

export default App;