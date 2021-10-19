import React , {useState, useEffect} from 'react';

import SignOut from '../components/SignOut';
import Channel from '../components/Channel';

// react firebase hooks
import { useCollectionData } from 'react-firebase-hooks/firestore';

const MainPage = ({firebase, auth, firestore, storage, database}) => {

    const { uid, photoURL } = auth.currentUser; //user's google uid and profile image
    const userdataRef = firestore.collection("userdata");
  
  
    // WORK HERE/ PUT ALL INTO A FUNCTION
    const connectedRef = database.ref(".info/connected");
    const userConnectionRef = database.ref(`users/${uid}`);

    useEffect(()=>{
      connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
          console.log("connected");
        } else {
          console.log("not connected");
        }
      });
      userConnectionRef.get()
      .then((data)=>{
        if(data.exists()){
          console.log(data.val());
        }
        else {
          console.log("need to create data here");
          // userConnectionRef.set({
          //   username: auth.currentUser.displayName,
          //   online: true
          // })
        }
      }).catch(error => {
        console.log(`There is an error: ${error}`);
      })
      // userConnectionRef.onDisconnect().remove();
      // userConnectionRef.onDisconnect().set({
      //   online: false
      // })
    
      // const [userList] = useCollectionData(userdataRef, {idField: 'id'});
    
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
              <SignOut auth={auth}/>
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
                          firebase= {firebase}
                          auth={auth}
                          firestore={firestore}
                          storage={storage}
                          channelID={currentChannelID ? currentChannelID : channel.id}
                          channelName={currentChannelName ? currentChannelName : channel.channelName}></Channel>
        })}
      </div>
    )
  }

  export default MainPage;