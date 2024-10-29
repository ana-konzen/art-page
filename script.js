const numColumns = 3;
const numArtworks = 5;
const loadingBuffer = document.getElementById("loading");
const changeButton = document.getElementById("change");
const infoCont = document.getElementById("info");
const galleryCont = document.getElementById("gallery");

createGallery();
changeButton.addEventListener("click", createGallery);

async function getData(colorValues) {
  const url = `https://api.artic.edu/api/v1/artworks/search?limit=${numArtworks}`;
  loadingBuffer.style.display = "block";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          bool: {
            must: [
              {
                range: {
                  "color.h": { gte: colorValues.h - 5, lte: colorValues.h + 5 },
                },
              },
              {
                range: {
                  "color.l": { gte: colorValues.l - 5, lte: colorValues.l + 5 },
                },
              },
              {
                range: {
                  "color.s": { gte: colorValues.s - 5, lte: colorValues.s + 5 },
                },
              },
              {
                range: {
                  "color.population": { gte: 900 },
                },
              },
              {
                range: {
                  "color.percentage": { gte: 0.3 },
                },
              },
            ],
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();

    return json;
  } catch (error) {
    console.error(error.message);
  }
}

async function getArtInfo(id) {
  const url = `https://api.artic.edu/api/v1/artworks/${id}?fields=title,artist_title,date_display,color,image_id`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    const imageData = {
      id: id,
      artist: json.data.artist_title,
      title: json.data.title,
      date: json.data.date_display,
      color: json.data.color,
      imageURL: `${json.config.iiif_url}/${json.data.image_id}/full/843,/0/default.jpg`,
    };
    return imageData;
  } catch (error) {
    console.error(error.message);
  }
}

async function setImageData() {
  console.log("setting image data");
  let data = await getData(getRandomColor());
  while (data.data.length < numArtworks) {
    loadingBuffer.style.display = "block";

    data = await getData(getRandomColor());
  }
  console.log(data);
  const imageData = [];
  for (const d of data.data) {
    const info = await getArtInfo(d.id);
    imageData.push(info);
  }
  console.log(imageData);
  return imageData;
}

// setImageData();

async function createGallery() {
  galleryCont.innerHTML = "";
  infoCont.innerHTML = "";

  const infoArr = await setImageData();
  loadingBuffer.style.display = "none";
  const columns = createGrid();

  for (let i = 0; i < infoArr.length; i++) {
    const info = infoArr[i];
    const div = document.createElement("div");
    const caption = document.createElement("div");
    const artLink = `https://www.artic.edu/artworks/${info.id}`;
    div.classList.add("gallery-cont");
    caption.classList.add("caption");
    const image = document.createElement("img");
    image.src = info.imageURL;
    div.appendChild(image);
    if (info.title === null) {
      info.title = "Untitled";
    }
    if (info.artist === null) {
      info.artist = "Unknown";
    }
    if (info.date === null) {
      info.date = "n.d.";
    }
    caption.innerHTML += `<p class="artist">${info.artist}</p><p><span class="title">${info.title}</span><br>${info.date}</p><p><a href="${artLink}" target="_blank">→ original</a></p>`;
    div.appendChild(caption);
    columns[i % numColumns].appendChild(div);
  }
  setBackground(infoArr);
  infoCont.style.color = `hsl(${infoArr[0].color.h}, ${infoArr[0].color.s - 30}%, ${
    infoArr[0].color.l - 20
  }%)`;
  infoCont.innerHTML = `h: ${infoArr[0].color.h} s: ${infoArr[0].color.s} l: ${infoArr[0].color.l}`;
}

function setBackground(arr) {
  let hSum = 0;
  let sSum = 0;
  let lSum = 0;
  for (const info of arr) {
    hSum += info.color.h;
    sSum += info.color.s;
    lSum += info.color.l;
  }
  const avgH = hSum / arr.length;
  const avgS = sSum / arr.length;
  const avgL = lSum / arr.length;
  document.body.style.backgroundColor = `hsl(${avgH}, ${avgS}%, ${avgL}%)`;
  changeButton.style.color = `hsl(${avgH}, ${avgS}%, ${avgL}%)`;
}

function createGrid() {
  const columns = [];
  for (let i = 0; i < numColumns; i++) {
    const col = document.createElement("div");
    col.classList.add("column");
    columns.push(col);
    galleryCont.appendChild(col);
  }

  return columns;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
  return {
    h: randomInt(0, 100),
    l: randomInt(30, 100),
    s: randomInt(30, 100),
  };
}
