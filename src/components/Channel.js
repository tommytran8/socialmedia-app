import React , {useState, useRef} from 'react';
import Post from '../components/Post';

import { useCollectionData } from 'react-firebase-hooks/firestore';

// assets
import smileicon from '../assets/smile.png'
import 'emoji-mart/css/emoji-mart.css';
import { Picker } from 'emoji-mart';

const Filter = require('bad-words');

const Channel = ({firebase, auth, firestore, storage, channelID, channelName}) =>{
    const { uid, photoURL } = auth.currentUser; //user's google uid and profile image
    const [maxPost, setMaxPost] = useState(5); // used in posts, only display 5 post at a time
    const increasePost = 20; //increase number of post displayed, 20 increments at a time
    const maxMessageLength = 100;
  
    const postsRef = firestore.collection(channelID); // gets collection from database called posts
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
  
    const resetFile = ()=>{
      setFile(null);
      setFileURL(null);
      setFileName(null);
      setFileType(null);
      document.getElementById("img").src = "";  
      document.getElementById("img").height = 0; 
      document.getElementById("link").href = ""; 
      document.getElementById("link").innerText = '';
    }
  
    return (
      <div id={"main-display"} onClick={()=>{if (emoji) setEmojiPicker(false); }}>
        {/* channel display */}
        <main id={"channel-display"} onScroll={handleScroll}>
          <div ref={dummy}></div>
          { fileT || formValue ? <div id={"temp-message"}>
            <p>{formValue}</p>
            <a id="link" target="_blank"></a>
            <img id="img" height="0" src=""></img>  
            {fileT ? <button onClick={resetFile}>x</button> : <></>}
          </div>
          : <></>}
          {posts && posts.map(post => <Post key={post.id} firebase={firebase} auth={auth} firestore={firestore} storage={storage} post={post} channel={channelID} disable={fileButton} />)}
          
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
                 {/* select emoji */}
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
  
         
          
        </section>
        
      </div>
    )
  }

  // TODO: CLEANER CODE
  const ChannelDisplay = ()=>{

  }
  const ChannelInput = ()=>{

  }

  const Message = ()=>{

  }

  const AddMessageButton = ()=>{

  }

  const UploadMedia = ()=>{

  }

  const UploadMediaButton = ()=>{

  }




  export default Channel;