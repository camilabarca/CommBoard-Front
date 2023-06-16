<script>
// @ts-nocheck

    import { auth } from "./firebase/firebase.js";
    import Commboard from './Commboard.svelte';
    import {
        onAuthStateChanged,
        GoogleAuthProvider,
        signInWithPopup,
        signOut,
    } from "firebase/auth";
    import { db } from "./firebase/firebase";
    import { doc, getDoc, setDoc } from "firebase/firestore";
    import Header from "./Header.svelte";
    import Modal from "./Modal.svelte";
    import { onMount } from 'svelte';

    let firebaseUser = null;

    let settingsModal = false;
    let logsModal = false;
    let audioSettingsModal = false;

    let pressStartTime = null;
    let buttonPressed = false;
    let timer = null;

    let logPressStartTime = null;
    let logButtonPressed = false;
    let logTimer = null;

    let guardian = null;
    let subject = null;
    let cardsPerRow = 8;
    let sintesizedVoice = true;
    let lang = 'en-US'
    let pitch = 1.0;
    let rate = 1.0;

    let commBoardState = {};
    let keyboard = [];
    let sections = []
    let keys = {};


    onAuthStateChanged(auth, (user) => {
        firebaseUser = user;
    });

    async function login() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log(user);
            const userRef = doc(db, "users", user.uid);
            const document = await getDoc(userRef);
            if (!document.exists()) {
                await setDoc(userRef, {
                    name: user.displayName,
                    role: "usuario",
                    email: user.email,
                });
            }
        } catch (error) {
            console.log("Error signing in:", error);
        }
    }

    function logout() {
        signOut(auth);
        firebaseUser = null;
        console.log(firebaseUser);
    }

    function handleLogButtonPress() {
        if (!logButtonPressed) {
            logPressStartTime = Date.now();
            logButtonPressed = true;

            logTimer = setInterval(() => {
                if (logButtonPressed && Date.now() - logPressStartTime >= 3000) {
                logsModal = true;
                clearInterval(logTimer);
                }
            }, 100);
        }
    }
    function handleLogButtonRelease() {
        logButtonPressed = false;
        clearInterval(logTimer);
    }

    function handleButtonPress() {
        if (!buttonPressed) {
            pressStartTime = Date.now();
            buttonPressed = true;

            timer = setInterval(() => {
                if (buttonPressed && Date.now() - pressStartTime >= 3000) {
                settingsModal = true;
                clearInterval(timer);
                }
            }, 100);
        }
    }

    function handleButtonRelease() {
        buttonPressed = false;
        clearInterval(timer);
    }

    function saveGuardianAndSubject(){
        settingsModal = false;
        saveCommBoardState();
    }

    let addCardModal = false;
    function openCardModal(){
        addCardModal = true;
        settingsModal = false;
    }

    function openAudioSettingsModal() {
        audioSettingsModal = true;
        settingsModal = false;
    }

    function closeCardModal(){
        addCardModal = false;
        settingsModal = true;
    }

    function closeLogModal(){
        logsModal = false;
    }

    function tryAudio(){
        const speechSynthesis = window.speechSynthesis;
        let text = 'Hello, how are you?'
        if (lang === 'es-ES'){
            text = "Hola ¿Cómo estás?"
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.pitch = pitch;
        utterance.rate = rate;
        speechSynthesis.speak(utterance);
    }

    function closeAudioSettings(){
        audioSettingsModal = false;
        settingsModal = true;
        saveCommBoardState();
    }


    auth.onAuthStateChanged((user) => {
        if(user) {
        if (sintesizedVoice){
            const userId = user.uid;
            db.collection('commBoardStates').doc(userId).get()
            .then((snapshot) => {
            if (snapshot && snapshot.exists) {
                const serializedState = snapshot.data().commBoardState;
                commBoardState = deserializeState(serializedState);
                console.log(commBoardState);
                keyboard = commBoardState['keyboard'];
                keys = commBoardState['keys'];
                sections = commBoardState['sections'];
                guardian = commBoardState['guardian'];
                subject = commBoardState['subject'];
                lang = commBoardState['lang'];
                pitch = commBoardState['pitch'];
                rate = commBoardState['rate'];
                cardsPerRow = commBoardState['cardsPerRow']
            }
            })
        }
        
        } else {
        keyboard = ["k", "m", "o", "p"];

        sections = [{"sound": new Audio('./sounds/no.mp3'), "name": "No", "key": "k"},
                        {"sound": new Audio('./sounds/yes.mp3'), "name": "Yes", "key": "m"},
                        {"sound": new Audio('./sounds/drink.mp3'), "name": "Drink", "key": "o"},
                        {"sound": new Audio('./sounds/eat.mp3'), "name": "Eat", "key": "p"}]
        
        keys = {"k": sections[0], "m": sections[1], "o": sections[2], "p": sections[3]};
            }
    })

    function deserializeState(serializedState) {
        const deserializedState = {
        keyboard: serializedState.keyboard || [],
        keys: {},
        sections: [],
        guardian: serializedState.guardian || '',
        subject : serializedState.subject || '',
        lang: serializedState.lang || 'en-US', 
        pitch: serializedState.pitch || 1.0,
        rate: serializedState.rate || 1.0,
        cardsPerRow: serializedState.cardsPerRow || 8
        };

        if (serializedState.keys) {
        for (const keyData of serializedState.keys) {
            const key = Object.keys(keyData)[0];
            const { sound, name, key: keyProp } = keyData[key];
            const audio = new Audio(sound);
            deserializedState.keys[key] = { sound: audio, name, key: keyProp };
        }
        }

        if (serializedState.sections) {
        for (const sectionData of serializedState.sections) {
            const { sound, name, key } = sectionData;
            const audio = new Audio(sound);
            deserializedState.sections.push({ sound: audio, name, key });
        }
        }
        return deserializedState;
    }

    function saveCommBoardState(){
        if (firebaseUser){
        const userId = firebaseUser.uid;
        commBoardState['keyboard'] = keyboard;
        commBoardState['keys'] = keys;
        commBoardState['sections'] = sections;
        const serializedState = {
            keyboard: commBoardState['keyboard'],
            keys: Object.keys(commBoardState['keys']).map((key) => ({
            [key]: {
                sound: '',
                name: commBoardState['keys'][key].name,
                key: commBoardState['keys'][key].key
            }
            })),
            sections: commBoardState['sections'].map((section) => ({
            sound: '',
            name: section.name,
            key: section.key
            })),
            guardian: guardian,
            subject: subject,
            lang: lang,
            pitch: pitch,
            rate: rate,
            cardsPerRow: cardsPerRow
        };
        console.log(serializedState);
        db.collection('commBoardStates').doc(userId).set({ commBoardState: serializedState })
        .then(() => {
            console.log('Comm board state saved successfully.');
        })
        .catch((error) => {
            console.error('Error saving comm board state:', error);
        });
        }
    }

    function closeSettings(){
        settingsModal = false;
        saveCommBoardState();
    }

</script>
 <main>
    <Header title="InCA ComBoard">
        <div slot="info">
            <div class="info-box">
                <div class="info-row">
                    <span class="label">Guardian:</span>
                    {#if guardian} 
                        <p>{guardian}</p>
                    {/if}
                </div>
                
                <div class="info-row">
                    <span class="label">Subject:</span>
                    {#if subject}
                        <p>{subject}</p>
                    {/if}
                </div>
        
                <div class="info-row">
                    <span class="label">User:</span>
                    {#if firebaseUser}
                        <p>{firebaseUser.email}</p>
                    {/if}
                </div>
            </div>
        </div>
        <div slot="buttons">
            <button on:mousedown={handleButtonPress} on:mouseup={handleButtonRelease}>Settings (Hold for 3 seconds)</button>
            <button on:mousedown={handleLogButtonPress} on:mouseup={handleLogButtonRelease}>Local Logs (Hold for 3 seconds)</button>
        </div>
    </Header>
    
    <Commboard firebaseUser ={firebaseUser} guardianName={guardian} subjectName={subject} settingsModal={settingsModal} {addCardModal} {closeCardModal} sintesizedVoice={sintesizedVoice} lang={lang} pitch={pitch} rate={rate} logsModal={logsModal} {closeLogModal} commBoardState={commBoardState} sections={sections} keyboard={keyboard} keys={keys} {saveCommBoardState} audioSettingsModal={audioSettingsModal} cardsPerRow = {cardsPerRow}/>
    {#if settingsModal}
    <Modal on:close={closeSettings}>
        <div class="modal-content">
          <div class="input-group">
            <label for="guardianName">Guardian Name</label>
            <input type="text" id="guardianName" name="guardianName" bind:value={guardian}>
          </div>
          <div class="input-group">
            <label for="subjectName">Subject Name</label>
            <input type="text" id="subjectName" name="subjectName" bind:value={subject}>
          </div>
          <div class="input-group">
            <label for="cardsPerRow">Cards per row</label>
            <input type="number" id="numberOfCards" min="1" max="15" bind:value={cardsPerRow}>
          </div>
          <div class="button-group">
            {#if firebaseUser}
              <button on:click={logout} class="btn">Logout</button>
            {:else}
              <button on:click={login} class="btn">Login with Google</button>
            {/if}
          </div>
          <div class="button-group">
            <button on:click={openCardModal}>Add New Card</button>
          </div>
          <div class="button-group">
            <button on:click={openAudioSettingsModal}>Audio Settings</button>
          </div>
          <div class="button-group">
            <button on:click={saveGuardianAndSubject}>Save</button>
          </div>
        </div>
        <div class="contact-info">
            <p>Camila Labarca</p>
            <a href="https://github.com/camilabarca/CommBoard-Front">Github repository</a>
            <p>camila.labarca@ug.uchile.cl</p>
        </div>
      </Modal>
    {/if}
    {#if audioSettingsModal}
    <Modal on:close={closeAudioSettings}>
        <div class="toggle-group">
            <label for="synthesizedVoice">Use Audio Recordings? (These sounds will not be saved in your account)</label>
            <div class="toggle-switch">
              <input type="checkbox" id="synthesizedVoice" name="synthesizedVoice" checked={!sintesizedVoice} on:change={() => sintesizedVoice = !event.target.checked}>
              <label for="synthesizedVoice"></label>
            </div>
        </div>
        <div class="input-group">
            <label for="language">Select Sound Language:</label>
            <select id="language" name="language" bind:value={lang}>
                <option value="en-US">English</option>
                <option value="es-ES">Spanish</option>
            </select>
        </div>
        <div class="input-group">
            <label for="pitch">Voice Pitch: {pitch.toFixed(1)}</label>
            <input type="range" id="pitch" min="0.1" max="2" step="0.1" bind:value={pitch}/>
        </div>
        <div class="input-group">
            <label for="rate">Voice Rate: {rate.toFixed(1)}</label>
            <input type="range" min="0.1" max="2" step="0.1" bind:value={rate}/>
        </div>
        <button on:click={tryAudio}>Try Audio</button>

    </Modal>
        
    {/if}
</main>

<style>
    .info-box {
        border: 1px solid #ccc;
        padding: 10px;
        background-color: rgb(234 122 122);
        border-radius: 4px;
    }

    .info-row {
        display: flex;
        align-items: center;
    }

    .label {
    font-weight: bold;
    margin-right: 5px;
    }

    p {
    margin: 0;
    }

    .modal-content {
        padding: 20px;
    }

    .input-group {
        margin-bottom: 10px;
    }

    .input-group label {
        display: block;
        margin-bottom: 5px;
    }

    .input-group input {
        width: 100%;
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .button-group {
        margin-bottom: 10px;
    }

    .button-group button {
        padding: 10px 20px;
        background-color: #fff3f3;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .toggle-group {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
        flex-direction: column;
    }

    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 25px;
    }

    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-switch label {
        position: absolute;
        top: 0;
        left: 0;
        width: 150%;
        height: 100%;
        background-color: #ccc;
        border-radius: 34px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .toggle-switch label:before {
        content: "";
        position: absolute;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: #fff;
        top: 3px;
        left: 3px;
        transition: transform 0.3s ease;
    }

    .toggle-switch input:checked + label {
        background-color: #69C779;
    }
    .toggle-switch input:checked + label:before {
        transform: translateX(16px);
    }
    .contact-info {
        background-color: #f2f2f2;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 10px;
        font-size: 12px;
        line-height: 1.4;
    }


</style>