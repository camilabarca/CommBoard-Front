<script>
  import sounds from './sounds.json';
  import Modal from './Modal.svelte';
  import { onMount } from 'svelte'

  const d = new Date();

  // async function doPost (sound, sujeto, guardian) {
	// 	const res = await fetch('http://localhost:8000/api/tasks/', {
	// 		method: 'POST',
  //     headers: {
  //       'Accept': 'application/json',
  //       'Content-Type': 'application/json'
  //     },
	// 		body: JSON.stringify({
  //       "date": d.toISOString().split('T')[0],
  //       "sound": sound,
  //       "sujeto": sujeto,
  //       "guardian": guardian
  //     })
	// 	})
		
	// 	const json = await res.json()
	// 	console.log(json);
	// }
  
  let currentKey = 0;
  let currentSound = null;
  let cardPressed = null;
  let previousEntries = [];
  let isActive = false;

  let keyboard = [];
  const keys = {};

  let sections = []

  const audio = new Audio();

  function playSound(sound, intention=null) {
      // doPost(sound.name, 'sujeto', 'guardian');
      if (window.event.ctrlKey){
        intention = "Modeling by Guardian"
      }
      let date = new Date();
      sound.sound.play();
      previousEntries.unshift({name: sound.name, intention: intention, time: date.toLocaleString()});
      if (previousEntries.length > 10) {
        previousEntries.pop();
      }
      previousEntries = previousEntries;
      cardPressed = sound.name;
  }

  function documentKeyDown(e) {
    console.log(e);
    if (!keys[e.key]) {
      return;
    } 
    const {
      file, name
    } = keys[e.key];
    const d = new Date();
    if(e.ctrlKey){
      playSound(keys[e.key], "Modeling by Guardian");
      currentSound = name;
    }else {
      playSound(keys[e.key]);
      currentSound = name;
    }
    
  }

  function documentKeyUp(e) {
    currentSound = null;
  }
  
  document.addEventListener('keydown', documentKeyDown);
  document.addEventListener("keyup", documentKeyUp);

  function logSelected(i) {
    const element = document.getElementById(i.toString());
    const option = element.value;
    previousEntries[i].intention = option;
  }

  let showModal = false;
  let showDeleteModal = false;
  let showModifyModal = false;
  let changeKeyModal = false;

  function deleteCard(){
    for(let i = 0; i < sections.length; i++){
      if(sections[i].name === cardPressed){
        sections.splice(i, 1);
        sections = sections;
      }
    }
    showDeleteModal = false;
  }

  function changeKey(){
    let key = document.getElementById("newkey").value 
    for(let i = 0; i < sections.length; i++){
      if(sections[i].name === cardPressed){
        console.log(sections[i]);
        let element = {"sound": sections[i].sound, "name": sections[i].name, "key": key}
        sections.splice(i, 1);
        sections.push(element);
        sections = sections;
        keys[key] = element;
        keyboard.push(key);
        keyboard = keyboard;
      }
    }
    changeKeyModal = false;
  }

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

  function startRecording(){ 
    isActive = true;
    mediaRecorder.start()
   }
  function stopRecording() {
    isActive = false;
    mediaRecorder.stop() 
    }
  function addSound(){
    let name = document.getElementById("name").value
    let key = document.getElementById("key").value 
    let sound = document.getElementById("x")
    if (name != '' && key != '' && sound != null){
      if (!keyboard.includes(key)){
        let element = {"sound": sound, "name": name, "key": key}
        sections.push(element);
        sections = sections;
        keys[key] = element;
        keyboard.push(key);
        keyboard = keyboard;
        showModal = false;
      } else {
        window.alert("Key already in use");
      }
      
    }
    
  }
  
</script>
<div>
  <button on:click={() => showModal = true}>Add new card</button>
</div>


<div class='container'>
  {#each sections as sound}
    <div 
      class='sound-button' on:mousedown={() => playSound(sound)} 
      on:contextmenu={() => showModifyModal=true}
      class:sound-button-active={currentSound === sound.name}
      >
      <h4>{sound.name}</h4>
      <small class='key'>{sound.key}</small>
    </div>
  {/each}
</div>

<div class='logs_container'>
  {#each previousEntries as entry, index}
    {#if index === 0}
      <div class='selected'>
        <p>{entry.name}</p>
        <p>{entry.time}</p>
        {#if entry.intention === null}
          <select id={index.toString()} on:change={() => logSelected(index)}>
            <option value='' selected>-----</option>
            <option value='Modeling by Guardian'>Modeling by Guardian</option>
            <option value='Non intentional'>Non intentional</option>
            <option value='intentional but unclear meaning'>intentional but unclear meaning</option>
            <option value='intentional and clear meaning'>intentional and clear meaning</option>
          </select>
        {:else}
          <p>{entry.intention}</p>
        {/if}
      </div> 
    {:else}
      <div>
        <p>{entry.name}</p>
        <p>{entry.time}</p>
        {#if entry.intention === null}
          <select id={index.toString()} on:change={() => logSelected(index)}>
            <option value='' selected>-----</option>
            <option value='Modeling by Guardian'>Modeling by Guardian</option>
            <option value='Non intentional'>Non intentional</option>
            <option value='intentional but unclear meaning'>intentional but unclear meaning</option>
            <option value='intentional and clear meaning'>intentional and clear meaning</option>
          </select>
        {:else}
          <p>{entry.intention}</p>
        {/if}
      </div>
    {/if} 
  {/each}
</div>

{#if showModal}
	<Modal on:close="{() => showModal = false}">
    <label for="name">Sound name</label>
    <input type="text" id="name" name="name">
    <br>
    <label for="key">Keyboard key</label>
    <input type="text" id="key" name="key" maxlength="1">
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
      <button on:click={addSound}>Add</button>
    </div>
    

	</Modal>
{/if}

{#if showModifyModal}
  <Modal on:close="{() => showModifyModal = false}">
    <button on:click={() => changeKeyModal = true}
            on:click={() => showModifyModal = false}>Change key</button>
    <button on:click={() => showDeleteModal = true}
            on:click={() => showModifyModal = false}>Delete card</button>
  </Modal>
{/if}
{#if changeKeyModal}
    <Modal on:close="{() => changeKeyModal = false}">
      <p>Change key</p>
      <label for="key">Keyboard key</label>
      <input type="text" id="newkey" name="key" maxlength="1">
      <button on:click={() => changeKey()}>Accept</button>
    </Modal>
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

  .selected {
    color: blue;
  }
  .logs_container {
    color: #000f08;
  }
  .container {
    width: 100vmin;
    height: 40vmin;
    text-align: center;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    /* grid-template-rows: repeat(5, 1fr); */
    grid-gap: 15px 15px;
    color: black;
    margin: 0 auto;
  }

  .sound-button {
        position: relative;
        background-color: azure;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        outline: 1px solid #000f08;
        font-size: 2.5vmin;
        cursor: pointer;
        box-shadow: 5px 5px 5px #000f08;
        transition: background 0.25s linear, color 0.25s linear,
        box-shadow 0.15s linear;
        text-transform: uppercase;
    }

    .sound-button:hover {
        background: rgb(140, 140, 212);
        color: #000f08 !important;
    }

    .key{
        font-size: 1.3vw;
        position: absolute;
        top: 1vw;
    }

    .sound-button:active,
    .sound-button-active {
      background: rgb(140, 140, 212);
      color: #000f08 !important;
      transform: translate(5px, 5px);
      box-shadow: none;
    }
</style>
