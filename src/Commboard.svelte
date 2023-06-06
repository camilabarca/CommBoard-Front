<script>
  import sounds from './sounds.json';
  import Modal from './Modal.svelte';
  import { onMount } from 'svelte'
  import { auth, database } from "./firebase/firebase";
  import { db, storage } from "./firebase/firebase"


  export let firebaseUser;
  export let guardianName;
  export let subjectName;
  export let settingsModal;
  export let sintesizedVoice;
  export let lang;
  export let pitch;
  export let rate;
  export let logsModal;
  let newCardModal = false;

  let shiftPressed = false;

  // export let commBoardState;
  
  

  const d = new Date();

  function sendData(date, sound) {
    let user = firebaseUser;
    let guardian = guardianName;
    let subject = subjectName;
    if (!guardian){
      guardian = "Anonymous"
    } 
    if (!subject){
      subject = "Anonymous"
    }
    if (!user) {
      user = "Anonymous"
    } else {
      user = firebaseUser.email;
    }
    const data = {
      date: date,
      sound: sound,
      subject: subject, 
      guardian: guardian,
      user: user
    };

    // Push the data to the "interactions" node in the database
    database.ref("interactions").push(data);
  }

  let currentKey = 0;
  let currentSound = null;
  let cardPressed = null;
  let previousEntries = [];
  let isActive = false;

  export let keyboard;
  export let sections;
  export let keys;


  const audio = new Audio();

  function playSound(sound, intention=null) {
      // obtain date
      let date = new Date();

      // send data with date, sound name and subject
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      const formattedDate = `${day}/${month}/${year}, ${hour}:${minute}:${second}`;
      sendData(formattedDate, sound.name);
      // @ts-ignore
      // if right click, don´t play sound
      if (window.event.which === 3){
        return;
      }
      // @ts-ignore
      // if control was pressed, the intention was modeled by guardian
      if (window.event.shiftKey || shiftPressed){
        intention = "Modeling by Guardian"
      }

      // play sound
      if (sintesizedVoice || sound.sound === ''){
        const speechSynthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(sound.name);
        utterance.lang = lang;
        utterance.pitch = pitch;
        utterance.rate = rate;
        speechSynthesis.speak(utterance);
      }
      
      else{
        sound.sound.play();
      }
      

      // add played sound to previous entries
      previousEntries.unshift({name: sound.name, intention: intention, time: date.toLocaleString()});
      // if there is more than 10 entries, delete last one
      if (previousEntries.length > 10) {
        previousEntries.pop();
      }
      previousEntries = previousEntries;
      // save card pressed
      cardPressed = sound.name;
  }

  function documentKeyDown(e) {
    let key  = (e.key).toLowerCase();
    // if the key is not in the dictionary, ignore (no sound associated)
    if (!keys[key] || showModal || showDeleteModal || showModifyModal || changeKeyModal || addCardModal || settingsModal) {
      return;
    } 
    // get file and name associated to key
    const {
      file, name
    } = keys[key];
    
    // if control is pressed play sound and set intention do modeled by guardian
    if(e.shiftKey || shiftPressed){
      playSound(keys[key], "Modeling by Guardian");
      currentSound = name;
    // else, just play souns
    }else {
      playSound(keys[key]);
      currentSound = name;
    }
    
  }

  // set currentSound to null whren keyboard press ends
  function documentKeyUp(e) {
    currentSound = null;
  }
  
  // add event listeners to keydown and keyup events
  document.addEventListener('keydown', documentKeyDown);
  document.addEventListener("keyup", documentKeyUp);

  // set intention by user
  function logSelected(i) {
    const element = document.getElementById(i.toString());
    // @ts-ignore
    const option = element.value;
    previousEntries[i].intention = option;
  }

  // show modals values
  let showModal = false;
  let showDeleteModal = false;
  let showModifyModal = false;
  let changeKeyModal = false;

  // delete a card
  function deleteCard(){
    // look for the card to be deleted
    for(let i = 0; i < sections.length; i++){
      // if you find the card pressed
      if(sections[i].name === cardPressed){
        // get the old key of this card
        let oldKey = sections[i].key;

        // delete element from sections list
        sections.splice(i, 1);
        sections = sections;

        // delete key from dictionary
        delete keys[oldKey];
        keys = keys;

        // delete key from dictionary
        keyboard.splice(i, 1);
        keyboard = keyboard;
      }
    }
    if (sintesizedVoice){
      saveCommBoardState();
    }
    

    // close modal
    showDeleteModal = false;
  }

  

  // change key associated with a card
  function changeKey(){
    // @ts-ignore
    // get the new value of the key
    let key = document.getElementById("newkey").value 
    if (key === "" || key === " "){
      window.alert("Please enter a key");
    }
    // search for card selected
    else if (!keyboard.includes(key)){
      for(let i = 0; i < sections.length; i++){
        if(sections[i].name === cardPressed){

          // get the old key
          let oldKey = sections[i].key;
          
          // create new element with new key
          let element = {"sound": sections[i].sound, "name": sections[i].name, "key": key}
          // delete previous element
          sections.splice(i, 1);
          // add new element
          sections.push(element);
          sections = sections;

          // delete previous key from dictionary
          delete keys[oldKey];
          // associate new key to element in the dictionary
          keys[key] = element;
          keys = keys;

          // delete previous key from keyboard
          keyboard.splice(i, 1);
          // add new key to keyboard
          keyboard.push(key);
          keyboard = keyboard;
          
        }
      }
      // close modal
      if(sintesizedVoice){
        saveCommBoardState();
      }
      
      changeKeyModal = false;
    } else {
      window.alert("Key already in use");
    }
    
    
  }

  // record a sound
  let media = [];
  let mediaRecorder = null;
  onMount(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => media.push(e.data)
    mediaRecorder.onstop = function(){
      const audio = document.querySelector('audio');
      const blob = new Blob(media, {'type' : 'audio/ogg; codecs=opus' });
      media = [];
      audio.src = window.URL.createObjectURL(blob);
      audio.id = "x"
    }
  })

  // start recording
  function startRecording(){ 
    isActive = true;
    mediaRecorder.start()
  }

  // stop recording
  function stopRecording() {
    isActive = false;
    mediaRecorder.stop() 
  }

  // check if safe mode was passed
  function safeMode(){
    // @ts-ignore
    let answer = document.getElementById("safeMode").value 

    // if answer is correct, show new card modal, if not close
    if (answer === "Add New Card"){
      showModal = false;
      newCardModal = true;
    }
    else {
      showModal = false;
    }
  }

  // add sound to cards
  function addSound(){

    let sound = '';
    // get name, key and sound from form
    // @ts-ignore
    let name = document.getElementById("name").value
    // @ts-ignore
    let key = document.getElementById("key").value 
    if (!sintesizedVoice){
      // @ts-ignore
      sound = document.getElementById("x")
    }
    

    // if all values are not null
    let key_lowercase = key.toLowerCase();
    if (!sintesizedVoice){
      if (name != '' && key_lowercase != '' && sound != null){
        if (!keyboard.includes(key_lowercase)){
          let element = {"sound": sound, "name": name, "key": key_lowercase}
          // @ts-ignore
          sections.push(element);
          sections = sections;
          keys[key_lowercase] = element;
          keyboard.push(key_lowercase);
          keyboard = keyboard;
          // @ts-ignore
          document.getElementById("name").value = "";
          // @ts-ignore
          document.getElementById("key").value = "";
          // if key is not available, alert
        } else {
          window.alert("Key already in use");
        }
      }
    }
    else {
      if (name != '' && key_lowercase != ''){
        // if key is available create element and add new sound
        if (!keyboard.includes(key_lowercase)){
          let element = {"sound": sound, "name": name, "key": key_lowercase}
          // @ts-ignore
          sections.push(element);
          sections = sections;
          keys[key_lowercase] = element;
          keyboard.push(key_lowercase);
          keyboard = keyboard;
          // @ts-ignore
          document.getElementById("name").value = "";
          // @ts-ignore
          document.getElementById("key").value = "";
          saveCommBoardState();
          // if key is not available, alert
        } else {
          window.alert("Key already in use");
        }
      
      
    }

    }
    
    
    
  }

  function handleContextMenu(event, card) {
    event.preventDefault();
    showModifyModal = true;
    cardPressed = card;
  }

  function handleShiftClick() {
    shiftPressed = true;
  }

  function handleShiftRelease(){
    shiftPressed = false;

  }

  export let addCardModal;
  export let closeCardModal;
  export let closeLogModal;
  export let saveCommBoardState;

</script>

<div>
  <button on:mousedown={handleShiftClick} on:mouseup={handleShiftRelease}>Shift</button>
</div>

<!-- Show all sounds in the list -->
<div class='container'>
  {#each sections as sound}
    <div 
      class='sound-button' on:mousedown={() => playSound(sound)} 
      on:contextmenu={(event) => handleContextMenu(event, sound.name)}
      class:sound-button-active={currentSound === sound.name}
      >
      <small class='key'>{sound.key}</small>
      <h4>{sound.name}</h4>
      
    </div>
  {/each}
</div>


{#if logsModal}
<Modal on:close={closeLogModal}>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Time</th>
        <th>Intention</th>
      </tr>
    </thead>
    <tbody>
      {#each previousEntries as entry, index}
      <tr class={index === 0 ? "last-entry" : ""}>
        <td>{entry.name}</td>
        <td>{entry.time}</td>
        <td>
          {#if entry.intention === null}
            <select id={index.toString()} on:change={() => logSelected(index)}>
              <option value='' selected>-----</option>
              <option value='Modeling by Guardian'>Modeling by Guardian</option>
              <option value='Non intentional'>Non intentional</option>
              <option value='Intentional but unclear meaning'>Intentional but unclear meaning</option>
              <option value='Intentional and clear meaning'>Intentional and clear meaning</option>
            </select>
          {:else}
            {entry.intention}
          {/if}
        </td>
      </tr>
      {/each}
    </tbody>
  </table>
</Modal>
{/if}



<!-- Modal: starts with a safe mode -->
{#if showModal}
  <Modal on:close="{()=> showModal = false}">
    <p>Type the next word to add a new card: "Add New Card"</p>
    <input type="text" id="safeMode" name="safeMode">
    <button on:click={safeMode}>Next</button>
  </Modal>
{/if}
<!-- Modal: add a new card form -->
{#if addCardModal}
	<Modal on:close={closeCardModal}>
    <label for="name">Sound name</label>
    <input type="text" id="name" name="name">
    <br>
    <label for="key">Keyboard key</label>
    <input type="text" id="key" name="key" maxlength="1">
    {#if !sintesizedVoice}
      <section>
        <button on:click={startRecording}>Record</button>
        <button on:click={stopRecording}>Stop</button>
        <div class="player">
          <div id="info" class="info {isActive ? 'active' : ''}">
            <span class="artist">Recording</span>
            
          </div>
          <div id="control-panel" class="control-panel {isActive ? 'active' : ''}">
            <div class="album-art" />
          </div>
        </div>
      </section>
      <div>
        <audio controls />
      </div>
    {/if}
    <div>
      <button on:click={addSound}>Add</button>
    </div>
	</Modal>
{/if}

<!-- Modal: modify or delete card -->
{#if showModifyModal}
  <Modal on:close="{() => showModifyModal = false}">
    <button on:click={() => changeKeyModal = true}
            on:click={() => showModifyModal = false}>Change key</button>
    <button on:click={() => showDeleteModal = true}
            on:click={() => showModifyModal = false}>Delete card</button>
  </Modal>
{/if}
<!-- Modal: change key associated with card -->
{#if changeKeyModal}
    <Modal on:close="{() => changeKeyModal = false}">
      <p>Change key</p>
      <label for="key">Keyboard key</label>
      <input type="text" id="newkey" name="key" maxlength="1">
      <button on:click={() => changeKey()}>Accept</button>
    </Modal>
<!-- Modal: delete card -->
{:else if showDeleteModal}
  <Modal on:close="{() => showDeleteModal = false}">
    <p>Delete card?</p>
    <button on:click={() => deleteCard()}>Yes</button>
    <button on:click={() => showDeleteModal = false}>No</button>
  </Modal>
{/if}

<style>

  .player {
    position: relative;
  }
  .player .info {
    position: relative;
    height: 60px;
    top: 0;
    opacity: 0;
    left: 10px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 15px;
    transition: all 0.5s ease;
  }
  .player .info .artist{
    display: block;
  }
  .player .info .artist {
    color: #222;
    font-size: 16px;
    margin-bottom: 5px;
    position:relative;
    top: 20px;
  }

  .player .info.active {
    opacity: 1;
    transition: all 0.5s ease;
  }
  .player .control-panel {
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
    height: 10px;
    z-index: 5;
  }
  .player .control-panel .album-art {
    position: absolute;
    left: 170px;
    top: 4px;
    height: 50px;
    width: 50px;
    border-radius: 50%;
    box-shadow: 0px 0px 20px 5px rgba(0, 0, 0, 0);
    transform: scale(0.5);
    transition: all 0.5s ease;
    opacity: 0;
  }
  .player .control-panel .album-art::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 15px;
    height: 15px;
    background-color: #fff;
    border-radius: 50%;
    z-index: 5;
    transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
  }
  .player .control-panel .album-art::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background-position: center;
    background-repeat: no-repeat;
    background-size: 150px;
    background-image: url("https://w0.peakpx.com/wallpaper/609/144/HD-wallpaper-red-light-background-red-aesthetic.jpg");
  }
  .player .control-panel.active .album-art {
    box-shadow: 0px 0px 20px 5px rgba(0, 0, 0, 0.2);

    transition: all 0.5s ease;
    opacity: 1;
  }
  .player .control-panel.active .album-art::before {
    animation: rotation 3s infinite linear;
    -webkit-animation: rotation 3s infinite linear;
    animation-fill-mode: forwards;
  }
  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .container {
    /* width: 100vmin; */
    /* height: 80vmin; */
    /* text-align: center; */
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-gap: 15px 15px;
    color: black;
    margin-top: 20px;
    margin-left: 10px;
    margin-right: 10px;
  }

  .sound-button {
        position: relative;
        background-color: rgba(0,0,0,0.2);
        display: inline-flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        outline: 8px solid #35394f;
        font-size: 2.5vmin;
        cursor: pointer;
        transition: background 0.25s linear, color 0.25s linear, box-shadow 0.15s linear;
        text-transform: uppercase;
        color: green;
    }

    .sound-button:hover {
        background: rgb(30, 53, 30);
        color: #deddff !important;
    }

    .key{
        font-size: 1.3vw;
        top: 1vw;
    }

    .sound-button:active,
    .sound-button-active {
      background: rgb(140, 140, 212);
      color: #000f08 !important;
      transform: translate(5px, 5px);
      box-shadow: none;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 8px;
      border: 1px solid #ddd;
      text-align: left;
    }

    th {
      background-color: #f2f2f2;
    }
    .last-entry {
      background-color: #f5f5f5;
    }

    button {
      background-color: #fff3f3;
    }
</style>
