    const API = "https://www.dnd5eapi.co/graphql/2014";
    const IMAGE_BASE = "https://www.dnd5eapi.co";

    const form = document.querySelector("#searchForm");
    const results = document.querySelector("#results");
    const status = document.querySelector("#status");
    const prevButton = document.querySelector("#prev");
    const nextButton = document.querySelector("#next");

    let currentMatches = [];
    let monsters = [];
    let loaded = false;
    let page = 0;
    const PAGE_SIZE = 10;

    prevButton.addEventListener("click", () => {
      page--;
      renderMonsters(currentMatches);
    });

    nextButton.addEventListener("click", () => {
      page++;
      renderMonsters(currentMatches);
    });
    

    // Request the data from the API server
    async function fetchBatch(skip, limit) {
  const query = `
    query ($skip: Int, $limit: Int) {
      monsters(skip: $skip, limit: $limit) {
        index name image size type alignment
        hit_points hit_dice
        speed { walk swim fly climb burrow }
        strength dexterity constitution intelligence wisdom charisma
        senses { passive_perception darkvision blindsight tremorsense truesight }
        languages challenge_rating xp
        damage_vulnerabilities damage_resistances damage_immunities
        special_abilities { name desc }
        actions { name desc }
        legendary_actions { name desc }
        reactions { name desc }
      }
    }
  `;

  const response = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { skip, limit } })
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || json?.errors || !json?.data?.monsters) {
    throw new Error(json?.errors?.[0]?.message || `HTTP ${response.status}`);
  }
  return json.data.monsters;
}

async function loadMonsters() {
  const all = [];
  const LIMIT = 100;

  for (let i = 0; i < 100; i++) {          // safety cap
    status.textContent = `Now scrying... (More than ${all.length} found so far)`;
    const batch = await fetchBatch(all.length, LIMIT);
    if (batch.length === 0) break;
    all.push(...batch);
  }

  monsters = all;
  loaded = true;
}
// set up filters to allow filtering of collected monster data
    function filterMonsters() {
      const name = document.querySelector("#name")
        .value.trim().toLowerCase();

      const type = document.querySelector("#type").value;
      const size = document.querySelector("#size").value;

      const maxCRValue = document.querySelector("#maxCR").value;

      const maxCR = maxCRValue === ""
        ? Infinity : Number(maxCRValue);

      return monsters.filter(monster => {
        

        return (
          monster.name.toLowerCase().includes(name) &&
          (!type || monster.type === type) &&
          (!size || monster.size === size) &&

          monster.challenge_rating <= maxCR
        );
      });
    }

    // display the filtered monsters per the user's own selected filters
    function renderMonsters(matches) {
      currentMatches = matches;
      results.replaceChildren();

      prevButton.classList.remove("hidden");
      nextButton.classList.remove("hidden");

      const start = page * PAGE_SIZE;
      const visible = matches.slice(start, start + PAGE_SIZE);

      for (const monster of visible) {
        const card = document.createElement("article");
        card.className = "monster";

        const title = document.createElement("h3");
        title.textContent = monster.name;

        const toggle = document.createElement("button");
        toggle.textContent = "View stats";

        const detailsType = document.createElement("p");
        detailsType.className = "details hidden";

        const detailsSize = document.createElement("p");
        detailsSize.className = "details hidden";

        const detailsAlign = document.createElement("p");
        detailsAlign.className = "details hidden";
       
        const detailsCR = document.createElement("p");
        detailsCR.className = "details hidden";

        //add a link to D&D beyond to allow user to find more external details
        const detailsLink = document.createElement("a");
        detailsLink.className = "details detaillink hidden";
        detailsLink.href = `https://www.dndbeyond.com/search?q=${encodeURIComponent(monster.name)}`;
        detailsLink.target = "_blank";
        detailsLink.rel = "noopener noreferrer";
        

        let img = null;
          if (monster.image) {
            img = document.createElement("img");
            img.src = IMAGE_BASE + monster.image;
            img.alt = monster.name;
            img.loading = "lazy";
            img.className = "monster-img";
            img.addEventListener("error", () => img.remove()); // hide broken images
}
        //tie the gathered data for each monster to a <p> section.
        detailsType.textContent =
          `Type: ${monster.type}`;

        detailsSize.textContent =
          `Size: ${monster.size}`;

        detailsAlign.textContent =
          `Alignment: ${monster.alignment}`;

        detailsCR.textContent =
          `CR: ${monster.challenge_rating}`;

        detailsLink.textContent =
          `View on D&D Beyond`;

          

          //add listener to allo wuser to 'expand' the details of a given monster when button is pressed
        toggle.addEventListener("click", () => {
          detailsType.classList.toggle("hidden");
          detailsSize.classList.toggle("hidden");
          detailsAlign.classList.toggle("hidden");
          detailsCR.classList.toggle("hidden");
          detailsLink.classList.toggle("hidden");
          toggle.textContent = details.classList.contains("hidden")
            ? "View Stats" : "Hide Stats";
        });

        card.append(
          img, title, detailsType, detailsSize, detailsAlign, detailsCR, detailsLink, toggle);
        results.append(card);
      }

      status.textContent = matches.length
        ? `${matches.length} monsters found. Showing ${
            start + 1
          }–${Math.min(start + PAGE_SIZE, matches.length)}.`
        : "No monsters match those filters... Try changing it up!";

      prevButton.disabled = page === 0;
nextButton.disabled = (page + 1) * PAGE_SIZE >= matches.length;   
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();

      status.textContent = "Loading monsters...";
      results.replaceChildren();

      try {
        if (!loaded) {
          await loadMonsters();
        }

        page = 0;
        const matches = filterMonsters();
        renderMonsters(matches);
      } catch (error) {
        status.textContent =
          `Could not load monsters: ${error.message}`;
      }
    });