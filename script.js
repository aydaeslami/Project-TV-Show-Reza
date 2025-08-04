// Public Vars
let episodeCounter = 0;
let searchValue = "";
let allEpisodes = [];
let allShows = []; // for all Shows API

///////// function for test
function AidaTestFor() {
  for (let i of allShows) {
    console.log(i);
  }
}

//  ----------------------- fetch Function------------------------

async function fetchAllShows() {
  try {
    const response = await fetch("https://api.tvmaze.com/shows");
    if (!response.ok) throw new Error("Failed to load show list");

    const shows = await response.json();
    // Sort alphabetically by name (case-insensitive)
    shows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    return shows;

  } catch (error) {
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "⚠️ Error loading shows. Please try again later.";
    errorMessage.style.color = "red";
    errorMessage.style.textAlign = "center";
    document.body.prepend(errorMessage);
    return []; // Return empty array to avoid crashing other parts
  }
}

function fetchEpisodesByShowId(showId) {
  // Add loading message specifically for episode fetch
  const waitLoadMessage = document.createElement("p");
  waitLoadMessage.id = "status-message";
  waitLoadMessage.textContent = "Loading episodes...";
  document.body.prepend(waitLoadMessage);

  fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load episodes");
      return res.json();
    })
    .then((episodes) => {
      allEpisodes = episodes;
      episodeCounter = episodes.length;

      // Remove loading message only *after success*
      const msg = document.getElementById("status-message");
      if (msg) msg.remove();

      dropBoxFill(episodes);
      makePageForEpisodes(episodes);
    })
    .catch((err) => {
      console.error("Error:", err);
      const msg = document.getElementById("status-message");
      if (msg) {
        msg.textContent = "⚠️ Failed to load episodes. Please try again later.";
      }
    });
}



//  ----------------------- main setup  ------------------------

async function setup() {
    // Fetch all shows
  allShows = await fetchAllShows();
  dropBoxAllShows(allShows);
  makePageForShows(allShows)

  // Event Listeners
  document.getElementById("searchInput").addEventListener("keyup", handleSearchEvent);
  document.getElementById("dropDownBoxFill").addEventListener("change", handleDropDownChange);
  document.getElementById("dDBAllShows").addEventListener("change", handleDropDownChange);
}



//  ----------------------- Event lister logic  ------------------------

function handleDropDownChange(event) {
  const selectedId = event.target.value;
  const targetId = event.target.id;

  switch (targetId) {
    case "dDBAllShows":
      if (selectedId === "allShows") {
        makePageForShows(allShows);
      } else {
        fetchEpisodesByShowId(selectedId);
      }
      break;

    case "dropDownBoxFill":
      if (selectedId === "all") {
        makePageForEpisodes(allEpisodes);
      } else {
        const selectedEpisode = allEpisodes.filter((ep) => ep.id == selectedId);
        episodeCounter = selectedEpisode.length; 
        makePageForEpisodes(selectedEpisode);
      }
      break;
  }
}

///////// =====================> Search Text Box Start
function searchEpisodes(allEpisodes, searchValue) {
  const filtered = searchValue
    ? allEpisodes.filter((episode) => {
        const name = episode.name.toLowerCase();
        const summary = episode.summary ? episode.summary.toLowerCase() : "";
        const search = searchValue.toLowerCase();
        return name.includes(search) || summary.includes(search);
      })
    : allEpisodes;
  makePageForEpisodes(filtered);
}

function handleSearchEvent(event) {
  searchValue = event.target.value;
  searchEpisodes(allEpisodes, searchValue);
}

////// =====================> search text box finish


//  ----------------------- Helper Function------------------------

function padNumber(num) {
  return num.toString().padStart(2, "0");
}

function formatEpisodeCode(season, number) {
  return `S${padNumber(season)}E${padNumber(number)}`;
}

function searchCounter(episodeList, episodeCounter) {
  const searchCounter = document.getElementById("searchCounter");
  searchCounter.textContent = `Displaying ${episodeList.length}/${episodeCounter} episode(s)`;
}


//  ----------------------- render Function------------------------

function makePageForEpisodes(listOfApi) {
  const containerEpisode = document.getElementById("episode-container");
  const templateEpisode = document.getElementById("episode-template");

  // Update search counter
  searchCounter(listOfApi, episodeCounter);

  // Clear container before rendering
  containerEpisode.innerHTML = "";

  // Handle case where no results were found
  if (listOfApi.length === 0) {
    containerEpisode.innerHTML = "<p>No episodes match your search.</p>";
    return;
  }

  // Render each episode card
  listOfApi.forEach((eachRecord) => {
    const clone = templateEpisode.content.cloneNode(true);

    // mage null check
    const img = clone.querySelector("img");
    if (eachRecord.image && eachRecord.image.medium) {
      img.src = eachRecord.image.medium;
      img.alt = eachRecord.name;
    } else {
      img.src = "https://via.placeholder.com/250x140?text=No+Image";
      img.alt = "No image available";
    }

    clone.querySelector(".title").textContent = eachRecord.name;
    clone.querySelector(".code").textContent =
      eachRecord.season !== undefined && eachRecord.number !== undefined
        ? formatEpisodeCode(eachRecord.season, eachRecord.number)
        : "Show";

    clone.querySelector(".summary").innerHTML = eachRecord.summary || "No summary available.";
    clone.querySelector(".link").href = eachRecord.url;

    containerEpisode.append(clone);
  });
}

function makePageForShows(listOfShows) {
  const containerEpisode = document.getElementById("episode-container");
  const templateEpisode = document.getElementById("episode-template");

  // Update search counter for shows
  searchCounter(listOfShows, listOfShows.length);

  // Clear container before rendering
  containerEpisode.innerHTML = "";

  // Handle case where no shows were found
  if (listOfShows.length === 0) {
    containerEpisode.innerHTML = "<p>No shows available.</p>";
    return;
  }

  // Render each show card
  listOfShows.forEach((eachShow) => {
    const clone = templateEpisode.content.cloneNode(true);

    // Image null check
    const img = clone.querySelector("img");
    if (eachShow.image && eachShow.image.medium) {
      img.src = eachShow.image.medium;
      img.alt = eachShow.name;
    } else {
      img.src = "https://via.placeholder.com/250x140?text=No+Image";
      img.alt = "No image available";
    }

    clone.querySelector(".title").textContent = eachShow.name;
    clone.querySelector(".code").textContent = "TV Show";

    clone.querySelector(".summary").innerHTML = eachShow.summary || "No summary available.";
    clone.querySelector(".link").href = eachShow.url || "#";

    containerEpisode.append(clone);
  });
}

// Id is a "value" for Option ==> episode.id
function dropBoxFill(allEpisodes) {
  const dropDBox = document.getElementById("dropDownBoxFill");
  dropDBox.innerHTML = "";

  /////// =====================> Aida Start
  // Show All Episodes
  dropDBox.add(new Option("Show All Episodes", "all"));

  allEpisodes.forEach((episode) => {
    dropDBox.add(
      new Option(
        `${formatEpisodeCode(episode.season, episode.number)} - ${
          episode.name
        }`,
        episode.id
      )
    );
  });
}


/////// =====================> Aida Start
// Show All Episodes

function dropBoxAllShows(allShows) {
  const dropDBoxShows = document.getElementById("dDBAllShows");
  dropDBoxShows.innerHTML = "";

  dropDBoxShows.add(new Option("Show All Shows", "allShows"));

  allShows.forEach((show) => {
    dropDBoxShows.add(new Option(show.name, show.id));
  });
}

/////// =====================> Aida Finish




window.onload = setup;
