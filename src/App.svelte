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

    let logPressStartTime = null;
    let logButtonPressed = false;
    let logTimer = null;

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

    function handleLoginButtonPress(){
        if (!logButtonPressed) {
            logPressStartTime = Date.now();
            logButtonPressed = true;

            logTimer = setInterval(() => {
                if (logButtonPressed && Date.now() - logPressStartTime >= 3000) {
                login();
                clearInterval(logTimer);
                }
            }, 100);
        }
    }

    function handleLogoutButtonPress(){
        if (!logButtonPressed) {
            logPressStartTime = Date.now();
            logButtonPressed = true;

            logTimer = setInterval(() => {
                if (logButtonPressed && Date.now() - logPressStartTime >= 3000) {
                logout();
                clearInterval(logTimer);
                }
            }, 100);
        }
    }

    function handleLogButtonRelease() {
        logButtonPressed = false;
        clearInterval(logTimer);
    }

    function saveGuardianAndSubject(){
        guardian = document.getElementById("guardianName").value;
        subject = document.getElementById("subjectName").value; 
        settingsModal = false;
    }

</script>
 <main>
    <Header title="InCA CommBoard">
        <div>
            {#if firebaseUser}
                <button on:mousedown={handleLogoutButtonPress} on:mouseup={handleLogButtonRelease} class="btn btn-primary">Logout</button>
            {:else}
                <button on:mousedown={handleLoginButtonPress} on:mouseup={handleLogButtonRelease} class="btn btn-secondary"
                    >Login with Google</button
                >
            {/if}
        </div>
        <button on:mousedown={handleButtonPress} on:mouseup={handleButtonRelease}>Settings</button>
    </Header>
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
        
    </div>
    <Commboard firebaseUser ={firebaseUser} guardianName={guardian} subjectName={subject} settingsModal={settingsModal}/>
    {#if settingsModal}
    <Modal on:close="{()=> settingsModal = false}">
        <div>
            <p>Guardian Name</p>
            <input type="text" id="guardianName" name="guardianName">
            <p>Subject Name</p>
            <input type="text" id="subjectName" name="subjectName">
        </div>
        <div>
            <button on:click={saveGuardianAndSubject}>Save</button>
        </div>    
    </Modal>
    {/if}
</main>

<style>
    .info-box {
    margin-top: 10px;
    top: 20px;
    left: 20px;
    max-width: 20%;
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

</style>