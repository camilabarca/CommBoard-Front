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

  const keyboard = ["PageDown", "*", "-", "'", "b", "6", "<", "1"];
  const keys = {};

  let sections = []

  const audio = new Audio();

  function playSound(sound) {
      // doPost(sound.name, 'sujeto', 'guardian');
      sound.sound.play();
      previousEntries.unshift({name: sound.name, intention: null});
      if (previousEntries.length > 10) {
        previousEntries.pop();
      }
      previousEntries = previousEntries;
      cardPressed = sound.name;
  }

  function documentKeyDown(e) {
    if (!keys[e.key]) {
      return;
    } 
    const {
      file, name
    } = keys[e.key];
    const d = new Date();
    playSound(keys[e.key]);
    currentSound = name;
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

  function deleteCard(){
    for(let i = 0; i < sections.length; i++){
      if(sections[i].name === cardPressed){
        sections.splice(i, 1);
        sections = sections;
      }
    }
    showDeleteModal = false;
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

  function startRecording(){ mediaRecorder.start() }
  function stopRecording() { mediaRecorder.stop() }
  function addSound(){
    let name = document.getElementById("name").value
    let key = document.getElementById("key").value 
    let sound = document.getElementById("x")
    console.log(sound) 
    let element = {"sound": sound, "name": name, "key": key}
    sections.push(element);
    sections = sections
  }
  
</script>
<div>
  <button on:click={() => showModal = true}>Add new card</button>
</div>


<div class='container'>
  {#each sections as sound}
    <div 
      class='sound-button' on:mousedown={() => playSound(sound)} 
      on:contextmenu={() => showDeleteModal=true}
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
    <input type="text" id="name">
    <input type="text" id="key">
    <section>
      <audio controls />
      <button on:click={startRecording}>Record</button>
      <button on:click={stopRecording}>Stop</button>
    </section>
    <button on:click={addSound}>Add</button>

	</Modal>
{/if}

{#if showDeleteModal}
	<Modal on:close="{() => showDeleteModal = false}">
    <p>Delete card?</p>
    <button on:click={() => deleteCard()}>Yes</button>
    <button on:click={() => showDeleteModal = false}>No</button>
	</Modal>
{/if}

<style>
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
