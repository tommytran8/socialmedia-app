# socialmedia-app

 Create a social media web application with react/firebase. Trying to recreate a <b>slack clone</b>.

## FEATURES
        [x] 1. NEED set it so that Upload Media immediately lets you choose file without using Choose File input. Upload Media should also be a paper clip like modern apps.
        [x] 2. Also need to fix some permission issues that sometimes causes app to not show images/files saved on firebase storage server
        [x] 3. MAYBE also delete images off of server when user deletes post
        [x] 4. MAYBE also have unique names for each image so it doesnt affect images with same file names
        [x] 5. Work on channels / profiles (Add channels for different forum discussions)
        [x] 6. UI
        [x] 7.1. Limit amount of post per user (1000) 
        [x] 7.2. Limit amount of files per user (10)
        [x] 7.3. Limit amount of channel per user (3)
        [x] 8. Load more post button => loads more than 5 post
        [x] 9.  problem where file will not upload correctly if user (refreshes page/delete post/upload new file) before upload is complete, 
                but refresh pages will prob be fine when its up on server, just need to prevent user from deleting posting and uploading new file as post loads
        [ ] 10. create server / invite users to server
        [ ] 11. delete channels / delete servers (requires a lot of reads/updates on firestore, but since my app is using the free data limits on firestore, I cannot add this feature)
        [x] 12. update userdata document when a new user enters (might need to check for bugs/ edge cases)
        [ ] 13. Sesson id?? need to see if it works on deploy first
        [ ] 14. Edit post message with setting icon

## LINK

https://socialmedia-app-3.web.app/

## SAMPLE IMAGES

#### Channel 1

![Channel 1 Image](./sample_photos/sample_1.PNG)

#### Using emojis

![Using emojis Image](./sample_photos/sample_2.PNG)

#### Channel 2

![Channel 2 Image](./sample_photos/sample_3.PNG)

#### Uploading Media 

![Uploading Media Image](./sample_photos/sample_4.PNG)