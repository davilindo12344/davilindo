const firebaseConfig = {
  apiKey: "AIzaSyA7n1M1DFVZrkOqEB6WAlTeg_qL4yYvTxs",
  authDomain: "spotify-eaac3.firebaseapp.com",
  projectId: "spotify-eaac3",
  storageBucket: "spotify-eaac3.appspot.com",
  messagingSenderId: "262950105793",
  appId: "1:262950105793:web:87ca0380049c7de4649a40"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userName = document.getElementById("userName");
const form = document.getElementById("playlistForm");
const musicList = document.getElementById("musicList");
const capa = document.getElementById("capa");
const nome = document.getElementById("nomeMusica");
const artista = document.getElementById("nomeArtista");
const audio = document.getElementById("audio");
const bar = document.getElementById("progress");
const publicaCheck = document.getElementById("publica");

let userUID = null;

loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
};

logoutBtn.onclick = () => {
  auth.signOut();
};

auth.onAuthStateChanged((user) => {
  if (user) {
    userUID = user.uid;
    userName.textContent = user.displayName;
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    form.classList.remove("hidden");
    loadPlaylists();
  } else {
    userUID = null;
    userName.textContent = "";
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    form.classList.add("hidden");
    musicList.innerHTML = "";
  }
});

form.onsubmit = async (e) => {
  e.preventDefault();
  const nome = form.nome.value;
  const capaFile = form.capa.files[0];
  const musicaFile = form.musica.files[0];
  const isPublica = publicaCheck.checked;

  const capaRef = storage.ref(`capas/${capaFile.name}`);
  const musicaRef = storage.ref(`musicas/${musicaFile.name}`);

  await capaRef.put(capaFile);
  await musicaRef.put(musicaFile);

  const capaURL = await capaRef.getDownloadURL();
  const musicaURL = await musicaRef.getDownloadURL();

  await db.collection("playlists").add({
    uid: userUID,
    nome,
    capa: capaURL,
    musica: musicaURL,
    publica: isPublica
  });

  form.reset();
  loadPlaylists();
};

async function loadPlaylists() {
  const snapshot = await db.collection("playlists").get();
  musicList.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const p = docSnap.data();
    if (p.uid === userUID || p.publica) {
      const div = document.createElement("div");
      div.className = "flex items-center gap-3 justify-between bg-gray-800 p-2 rounded";
      div.innerHTML = `
        <div class="flex items-center gap-3 cursor-pointer" id="play-${docSnap.id}">
          <img src="${p.capa}" class="w-14 h-14 rounded" />
          <div>
            <p class="font-bold">${p.nome}</p>
          </div>
        </div>
        ${p.uid === userUID ? `<button class="text-red-500" id="del-${docSnap.id}">Excluir</button>` : ""}
      `;
      musicList.appendChild(div);

      document.getElementById(`play-${docSnap.id}`).onclick = () => playMusic(p);
      if (p.uid === userUID) {
        document.getElementById(`del-${docSnap.id}`).onclick = async () => {
          await db.collection("playlists").doc(docSnap.id).delete();
          loadPlaylists();
        };
      }
    }
  });
}

function playMusic(p) {
  audio.src = p.musica;
  nome.textContent = p.nome;
  artista.textContent = "🎵";
  capa.src = p.capa;
  audio.play();
  Vibrant.from(p.capa).getPalette().then(palette => {
    document.getElementById("player").style.backgroundColor = palette.Vibrant.getHex();
  });
}

audio.ontimeupdate = () => { bar.value = audio.currentTime; };
audio.onloadedmetadata = () => { bar.max = audio.duration; };
bar.oninput = () => { audio.currentTime = bar.value; };