const DeleteButton = ({firebase, auth, firestore, storage, post, channel, disable, checkDelete})=>{
    const userDataRef = firestore.collection("userdata").doc(post.uid);

    const handleDeletePost = async ()=>{
        if (window.confirm("Are you sure you want to delete this post?")){
          await deletePost();
          await deleteFile();
        }
      }

      //deletes post from firestore database
      async function deletePost() {
        await firestore.collection(channel).doc(post.id).delete()
          .then(()=>{
            console.log(`Deleted post with post: ${post.text} by ${auth.currentUser.displayName}`)
            userDataRef.update({
              numOfPost: firebase.firestore.FieldValue.increment(-1), 
            })
          })
      }

      //deletes file attached to post from firebase storage
      async function deleteFile() {
        const storageRef = storage.ref(`${post.uid}/${post.id}`);
          await storageRef.delete().then(() => {
            console.log(`Deleted file attached to post: ${post.text} by ${auth.currentUser.displayName}`)
            userDataRef.update({
              numOfFiles: firebase.firestore.FieldValue.increment(-1), 
            })
          }).catch((error) => {
            console.log("File does not exist");
          });
      }

      return ( checkDelete ? <button className={"delete_button"} disabled={disable} onClick={handleDeletePost}>{"delete"}</button>: <></> )
  }

  export default DeleteButton;