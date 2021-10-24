const FeaturedPost = ({post}) =>{
    const {text, fileURL, fileName, fileType, displayName} = post;
    return (
        <>
            <p>{displayName}</p>
            <p>{text}</p>
            {fileURL ? fileType.startsWith("image") ? <img src={fileURL} alt={"Media"} height="250"></img> : <a href={fileURL} target="_blank" rel={"noreferrer"}>{fileName}</a> : <></>}
            <hr></hr>
        </>
    )
}

export default FeaturedPost;
