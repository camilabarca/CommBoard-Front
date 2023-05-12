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

    let firebaseUser = null;

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

</script>
 <main>
    <Header title="InCA CommBoard">
        <div>
            {#if firebaseUser}
                <button on:click={logout} class="btn btn-primary">Logout</button>
            {:else}
                <button on:click={login} class="btn btn-secondary"
                    >Login with Google</button
                >
            {/if}
        </div>
    </Header>

    
    <Commboard firebaseUser ={firebaseUser}/>
</main>
