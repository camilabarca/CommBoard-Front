<script>
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

    let pressStartTime = null;
    let buttonPressed = false;
    let timer = null;

    let guardian = null;
    let subject = null;

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
        // @ts-ignore
        guardian = document.getElementById("guardianName").value;
        // @ts-ignore
        subject = document.getElementById("subjectName").value; 
        settingsModal = false;
    }

</script>
 <main>
    <Header title="InCA CommBoard">
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
        </div>
    </Header>
    
    <Commboard firebaseUser ={firebaseUser} guardianName={guardian} subjectName={subject} settingsModal={settingsModal}/>
    {#if settingsModal}
    <Modal on:close={() => settingsModal = false}>
        <div class="modal-content">
          <div class="input-group">
            <label for="guardianName">Guardian Name</label>
            <input type="text" id="guardianName" name="guardianName">
          </div>
          <div class="input-group">
            <label for="subjectName">Subject Name</label>
            <input type="text" id="subjectName" name="subjectName">
          </div>
          <div class="button-group">
            {#if firebaseUser}
              <button on:click={logout} class="btn">Logout</button>
            {:else}
              <button on:click={login} class="btn">Login with Google</button>
            {/if}
          </div>
          <div class="button-group">
            <button on:click={saveGuardianAndSubject}>Save</button>
          </div>
        </div>
      </Modal>
    {/if}
</main>

<style>
    .info-box {
        border: 1px solid #ccc;
        padding: 10px;
        background-color: #f8f8f8;
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
        background-color: #f0f0f0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

</style>