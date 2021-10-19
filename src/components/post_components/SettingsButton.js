import settingsicon from '../../assets/settings.png';
const SettingsButton = ({auth, uid, checkDelete, setCheckDelete})=>{
    const handlePostSettings = ()=>{
        setCheckDelete(!checkDelete)
    }
    return ( uid == auth.currentUser.uid ? <img src={settingsicon} height={25} width={25} onClick={handlePostSettings}></img> : <></>)
}

export default SettingsButton;