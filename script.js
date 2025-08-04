//  ----------------------- global variable ------------------------
let episodeCounter = 0;
let searchValue = "";
let allEpisodes = [];
let allShows = []; // for all Shows API

//  ----------------------- fetch Functions ------------------------

/**
 * Fetches all TV shows from the TVMaze API and sorts them alphabetically
 * @returns {Promise<Array>} Array of show objects sorted by name, or empty array on error
 */
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

/**
 * Fetches all episodes for a specific TV show by its ID
 * Shows loading message during fetch and updates UI when complete
 * @param {number|string} showId - The ID of the show to fetch episodes for
 */
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

/**
 * Main initialization function that runs when the page loads
 * Fetches shows, populates dropdowns, displays initial content, and sets up event listeners
 */
async function setup() {
    // Fetch all shows
  allShows = await fetchAllShows();
  dropBoxAllShows(allShows);
  makePageForShows(allShows)

  // Event Listeners
  document.getElementById("searchInput").addEventListener("keyup", handleSearchEvent);
    document.getElementById("searchInput").addEventListener("search", handleSearchEvent);
  document.getElementById("dropDownBoxFill").addEventListener("change", handleDropDownChange);
  document.getElementById("dDBAllShows").addEventListener("change", handleDropDownChange);
}

//  ----------------------- Event lister logic  ------------------------

/**
 * Handles dropdown selection changes for both show and episode dropdowns
 * @param {Event} event - The change event from the dropdown
 */
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
        episodeCounter = allShows.length;
        makePageForEpisodes(allEpisodes);
      } else {
        const selectedEpisode = allEpisodes.filter((ep) => ep.id == selectedId);
        episodeCounter = selectedEpisode.length; 
        makePageForEpisodes(selectedEpisode);
      }
      break;
  }
}

/**
 * Handles search input events (typing and clearing)
 * Filters episodes based on search term or resets to show all episodes when cleared
 * @param {Event} event - The input event from the search box
 */
function handleSearchEvent(event) {
  searchValue = event.target.value;

  if (searchValue === "" || searchValue.length === 0) {
    document.getElementById("dropDownBoxFill").value = "all";
    makePageForEpisodes(allEpisodes);
  } else {
    searchEpisodes(allEpisodes, searchValue);
  }
}

//  ----------------------- Helper Function------------------------

/**
 * Pads a number with leading zeros to ensure it's at least 2 digits
 * @param {number} num - Number to pad
 * @returns {string} Padded number as string (e.g., 1 becomes "01")
 */
function padNumber(num) {
  return num.toString().padStart(2, "0");
}

/**
 * Formats season and episode numbers into standard TV format (e.g., S01E05)
 * @param {number} season - Season number
 * @param {number} number - Episode number
 * @returns {string} Formatted episode code
 */
function formatEpisodeCode(season, number) {
  return `S${padNumber(season)}E${padNumber(number)}`;
}

/**
 * Updates the search counter display to show current results vs total
 * @param {Array} episodeList - Current filtered list of episodes
 * @param {number} episodeCounter - Total number of episodes available
 */
function searchCounter(episodeList, episodeCounter) {
  const searchCounter = document.getElementById("searchCounter");
  searchCounter.textContent = `Displaying ${episodeList.length}/${episodeCounter} episode(s)`;
}

//  ----------------------- render Function------------------------

/**
 * Filters episodes based on search term in name or summary
 * @param {Array} allEpisodes - Array of all episodes to search through
 * @param {string} searchValue - Search term to filter by
 */
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

/**
 * Renders episode cards on the page using the template
 * Creates cards for each episode with image, title, episode code, summary, and link
 * @param {Array} listOfApi - Array of episode objects to display
 */
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

    // Image null check
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

/**
 * Renders show cards on the page using the template
 * Creates clickable cards for each show that when clicked, loads that show's episodes
 * @param {Array} listOfShows - Array of show objects to display
 */
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

    // Add click event to make show cards clickable
    const card = clone.querySelector(".card");
    card.addEventListener("click", function() {
      // Update the dropdown to show the selected show
      document.getElementById("dDBAllShows").value = eachShow.id;
      // Fetch and display episodes for this show
      fetchEpisodesByShowId(eachShow.id);
    });

    containerEpisode.append(clone);
  });
}

/**
 * Populates the episode dropdown with all episodes from current show
 * Creates options with formatted episode codes and names
 * @param {Array} allEpisodes - Array of episode objects to populate dropdown with
 */
function dropBoxFill(allEpisodes) {
  const dropDBox = document.getElementById("dropDownBoxFill");
  dropDBox.innerHTML = "";

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

/**
 * Populates the show dropdown with all available shows
 * Creates options with show names, sorted alphabetically
 * @param {Array} allShows - Array of show objects to populate dropdown with
 */
function dropBoxAllShows(allShows) {
  const dropDBoxShows = document.getElementById("dDBAllShows");
  dropDBoxShows.innerHTML = "";

  dropDBoxShows.add(new Option("Show All Shows", "allShows"));

  allShows.forEach((show) => {
    dropDBoxShows.add(new Option(show.name, show.id));
  });
}

// Initialize the application when the page loads
window.onload = setup;