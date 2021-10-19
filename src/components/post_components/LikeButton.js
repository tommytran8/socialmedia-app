import likeicon from '../../assets/like.png'
const LikeButton = ({firebase, auth, firestore, post, channel})=>{

    const handleLikePost = ()=>{
        //checks if user already liked post
        !post.usersLiked.includes(auth.currentUser.uid) ? updateLikes(1) : updateLikes(-1);
    }

    function updateLikes(operand) {
        firestore.collection(channel).doc(post.id).update({
        likes: firebase.firestore.FieldValue.increment(operand), // likes: likes + 1 OR likes - 1,
        usersLiked: operand === 1 ? firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid) : firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid) // usersLiked.push(auth.currentUser.uid);
        })
        .then (()=>{
            operand === 1 ? console.log(`Post liked by ${auth.currentUser.displayName}`) : console.log(`Post unliked by ${auth.currentUser.displayName}`  )
        })
        .catch((error)=>{
            console.error("Error liking the post: ", error);
        })
    }

    return <button className={"like_button"} onClick={handleLikePost}><img src={likeicon} alt={"Like"} height={20}></img> {post.likes}</button>
}



  export default LikeButton;