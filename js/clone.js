let currentsong = new Audio();
let songs = [];
let currentfolder = '';
let songul;
let play, previous, next;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder) {
    currentfolder = folder;
    try {
        let response = await fetch(`http://127.0.0.1:5500/${folder}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return []; // Important: Return an empty array in case of error
    }
}

const playmusic = (track, autoplay = false) => {
    currentsong.src = `/${currentfolder}/` + track;
    currentsong.addEventListener('loadedmetadata', () => {
        document.querySelector(".songinfo").innerHTML = decodeURI(track);
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    });
    currentsong.addEventListener("timeupdate", () => {
        const currentTime = currentsong.currentTime;
        const duration = currentsong.duration;
        if (!isNaN(currentTime) && !isNaN(duration)) {
            document.querySelector(".songtime").innerHTML = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        } else if (!isNaN(currentTime) && isNaN(duration)) {
            document.querySelector(".songtime").innerHTML = `${formatTime(currentTime)} --:-- `;
        }
        document.querySelector(".circle").style.left = (currentTime / duration) * 100 + "%";
    });
    if (autoplay) {
        currentsong.play();
    }
};

async function loadPlaylist(folder) {
    songs = await getsongs(folder);
    songul.innerHTML = ""; // Clear the current song list
    songs.forEach(song => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="music"><img class="invert" src="img/music.svg" alt=""></div>
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
            </div>
            <div class="playnow">
                <span>play now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        `;
        songul.appendChild(li);
        li.addEventListener("click", () => {
            playmusic(li.querySelector(".info div").textContent.trim(), true);
            play.src = "img/pause.svg"; // Change play button to pause
        });
    });
    if (songs.length > 0) {
        playmusic(songs[0], false); // Automatically play the first song
        play.src = "img/pause.svg"; // Ensure play button shows pause when a song is loaded
    }
}

async function displayAlbums() {
    console.log("displaying albums");
    let response = await fetch(`/songs/`);
    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        console.log("e.href:", e.href);
        if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-1)[0];
            console.log("Fetching info.json for folder:", folder);
            
            // Construct the URL for the info.json file
            let url = `./songs/${folder}/info.json`;
            console.log("Fetching URL:", url);

            // Get the metadata of the folder
            let a = await fetch(url);
            let response = await a.json(); 
            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${response.title}</h2>
                    <p>${response.description}</p>
                </div>`;
        }
    }

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => { 
        e.addEventListener("click", async () => {
            console.log("Fetching Songs");
            const folder = e.dataset.folder; // Get the folder from the clicked card
            await loadPlaylist(`songs/${folder}`); // Load the playlist for the selected album
        });
    });
}

async function main() {
    songul = document.querySelector(".songlist ul");
    play = document.getElementById("play");
    previous = document.getElementById("previous");
    next = document.getElementById("next");

    document.addEventListener('DOMContentLoaded', async function () { // DOMContentLoaded event
        await loadPlaylist("songs/ncs");
        await displayAlbums();
    });

    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "img/pause.svg";
        } else {
            currentsong.pause();
            play.src = "img/play.svg";
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (currentsong.duration) * percent / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    let currentSongIndex = 0;
    previous.addEventListener("click", () => {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        playmusic(songs[currentSongIndex], true);
        play.src = "img/pause.svg";
    });

    next.addEventListener("click", () => {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        playmusic(songs[currentSongIndex], true);
        play.src = "img/pause.svg";
    });

    const volumeButton = document.querySelector(".volume");
    const volumeRange = document.querySelector(".range");

    volumeButton.addEventListener("click", () => {
        volumeRange.style.display = (volumeRange.style.display === "block") ? "none" : "block";
    });
    volumeButton.getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
    if(currentsong.volume>0){
        document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
    }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        const volumeImg = e.target;
    
        if (volumeImg.src.includes("volume.svg")) {
            volumeImg.src = "img/mute.svg";
            currentsong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
            

        } else {
            volumeImg.src = "img/volume.svg";
            currentsong.volume = .10; 
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });
    
}

main();