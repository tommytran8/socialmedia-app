import React , {useState} from 'react';
import FeaturedPost from './post_components/FeaturedPost';
import SettingsButton from './post_components/SettingsButton';
import LikeButton from './post_components/LikeButton';
import DeleteButton from './post_components/DeleteButton';

const Post = ({firebase, auth, firestore, storage, post, channel, disable}) => {
  
    //class set according to user
    const postClass = post.uid === auth.currentUser.uid ? 'posted' : 'received';
    const [checkDelete, setCheckDelete] = useState(false);

    return (
      // different style depending on sent or received className
      <div className={`post ${postClass}`} > 
        <img height={"50"} src={post.photoURL}/>
        <div>
            <FeaturedPost post={post} />
            <LikeButton firebase= {firebase} auth={auth} firestore={firestore} post={post} channel={channel} />
        </div>
  
        <div>
          {/* only display delete on Post objects that belong to current user */}
            <SettingsButton auth={auth} uid={post.uid} checkDelete={checkDelete} setCheckDelete={setCheckDelete} />
            <DeleteButton firebase= {firebase} auth={auth} firestore={firestore} storage={storage} post={post} channel={channel} disable={disable} checkDelete={checkDelete} />
        </div>
    </div>
    ) 
  }

  export default Post;