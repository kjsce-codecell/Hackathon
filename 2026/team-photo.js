// Teams photo gallery logic for year-wise tabs and Google Drive images.
const START_YEAR = 2026;
const END_YEAR = 2018;

const DRIVE_DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

// Keep secrets out of the browser. Use a Google OAuth client ID here,
// and restrict it to your site origin in Google Cloud Console.
const GOOGLE_OAUTH_CLIENT_ID = window.GOOGLE_OAUTH_CLIENT_ID || "255972036129-368skp2k2qcqt5k2kfr2por6443bfnrg.apps.googleusercontent.com";

// Map each year to the Drive folder that should power that year’s gallery.
// Folder IDs are not secrets, but they should still only point to folders you control.
const TEAM_PHOTO_FOLDER_IDS = window.TEAM_PHOTO_FOLDER_IDS || {
  2026: "1I21_aFRZIiH1hrn2cumnCFUozjEuYka6",
  2025: "YOUR_FOLDER_ID_FOR_2025",
  2024: "YOUR_FOLDER_ID_FOR_2024",
  2023: "YOUR_FOLDER_ID_FOR_2023",
  2022: "YOUR_FOLDER_ID_FOR_2022",
  2021: "YOUR_FOLDER_ID_FOR_2021",
  2020: "YOUR_FOLDER_ID_FOR_2020",
  2019: "YOUR_FOLDER_ID_FOR_2019",
  2018: "YOUR_FOLDER_ID_FOR_2018",
};

let tokenClient = null;
let accessToken = "";
let driveClientReady = false;
let currentYear = String(START_YEAR);
let yearCache = new Map();
let activeRequestId = 0;

const buildYearList = () => {
  const years = [];
  for (let year = START_YEAR; year >= END_YEAR; year -= 1) {
    years.push(String(year));
  }
  return years;
};

const isTeamsPhotoPage = () => {
  const pageName = window.location.pathname.split("/").pop()?.toLowerCase() || "";
  return pageName === "teams-photo.html";
};

const getFileName = (path) => {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const alreadyAvailable =
      (src.includes("apis.google.com/js/api.js") && typeof window.gapi !== "undefined") ||
      (src.includes("accounts.google.com/gsi/client") &&
        typeof window.google !== "undefined" &&
        window.google.accounts &&
        window.google.accounts.oauth2);

    if (alreadyAvailable) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      const existingReady =
        existing.dataset.loaded === "true" ||
        (src.includes("apis.google.com/js/api.js") && typeof window.gapi !== "undefined") ||
        (src.includes("accounts.google.com/gsi/client") &&
          typeof window.google !== "undefined" &&
          window.google.accounts &&
          window.google.accounts.oauth2);

      if (existingReady) {
        existing.dataset.loaded = "true";
        resolve();
        return;
      }

      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

const ensureGoogleLibraries = async () => {
  await Promise.all([
    loadScript("https://apis.google.com/js/api.js"),
    loadScript("https://accounts.google.com/gsi/client"),
  ]);
};

const renderCards = (gridEl, year, photos) => {
  gridEl.innerHTML = "";

  if (!photos.length) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.textContent = `No photos found for ${year}. Add files to the linked Drive folder.`;
    gridEl.appendChild(empty);
    return;
  }

  photos.forEach((photo) => {
    const card = document.createElement("article");
    card.className = "photo-card";

    const img = document.createElement("img");
    img.className = "photo-media";
    img.src = photo.src;
    img.alt = photo.name || `${year} team photo`;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    let fallbackTried = false;
    img.onerror = () => {
      if (!fallbackTried && photo.fallbackSrc && photo.fallbackSrc !== img.src) {
        fallbackTried = true;
        img.src = photo.fallbackSrc;
        return;
      }
      img.style.display = "none";
      caption.textContent = `${photo.name || getFileName(photo.src)} (preview unavailable)`;
    };

    const caption = document.createElement("p");
    caption.className = "photo-meta";
    caption.textContent = photo.name || getFileName(photo.src);

    card.appendChild(img);
    card.appendChild(caption);

    if (photo.webViewLink) {
      const link = document.createElement("a");
      link.href = photo.webViewLink;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "photo-meta";
      link.style.borderTop = "none";
      link.textContent = "Open in Drive";
      card.appendChild(link);
    }

    gridEl.appendChild(card);
  });
};

const setStatus = (statusEl, message, variant = "info") => {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
  statusEl.dataset.variant = variant;
};

const buildDriveImageUrl = (fileId) => `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
const buildDriveAuthedImageUrl = (fileId) => {
  if (!accessToken) {
    return buildDriveImageUrl(fileId);
  }
  return `${buildDriveImageUrl(fileId)}&access_token=${encodeURIComponent(accessToken)}`;
};
const buildDriveThumbnailUrl = (fileId) => `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
const normalizeThumbnailUrl = (thumbnailLink) => {
  if (!thumbnailLink) {
    return "";
  }
  return thumbnailLink.replace(/=s\d+$/, "=s1600");
};
const isLikelyUnsupportedMime = (mimeType) =>
  typeof mimeType === "string" && (mimeType.includes("heic") || mimeType.includes("heif"));

const fetchDriveImagesForYear = async (year) => {
  if (yearCache.has(year)) {
    return yearCache.get(year);
  }

  const folderId = TEAM_PHOTO_FOLDER_IDS[year];
  if (!folderId || folderId.startsWith("YOUR_")) {
    yearCache.set(year, []);
    return [];
  }

  if (!driveClientReady) {
    throw new Error("Drive client is not ready yet.");
  }

  const response = await gapi.client.drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
    fields: "files(id,name,mimeType,modifiedTime,thumbnailLink,webViewLink)",
    orderBy: "modifiedTime desc",
    pageSize: 100,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const files = response.result.files || [];
  const photos = files.map((file) => {
    const thumbFromApi = normalizeThumbnailUrl(file.thumbnailLink);
    const thumbFromFileId = buildDriveThumbnailUrl(file.id);
    const thumbnailSrc = thumbFromApi || thumbFromFileId;
    const mediaSrc = buildDriveAuthedImageUrl(file.id);
    const useThumbnailFirst = isLikelyUnsupportedMime(file.mimeType);

    return {
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      src: useThumbnailFirst ? thumbnailSrc : mediaSrc,
      fallbackSrc: useThumbnailFirst ? mediaSrc : thumbnailSrc,
    };
  });

  yearCache.set(year, photos);
  return photos;
};

const updateYearButtons = (navEl, year) => {
  navEl.querySelectorAll(".year-btn").forEach((btn) => {
    const isActive = btn.dataset.year === year;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
};

const buildGalleryShell = (pageEl) => {
  let header = pageEl.querySelector(".photos-header");
  let nav = pageEl.querySelector("#years-nav");
  let status = pageEl.querySelector("#drive-status");
  let actions = pageEl.querySelector("#drive-actions");

  if (!actions) {
    actions = document.createElement("div");
    actions.id = "drive-actions";
    actions.style.cssText = "display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:18px 0 20px;";
    pageEl.insertBefore(actions, nav);
  }

  if (!status) {
    status = document.createElement("div");
    status.id = "drive-status";
    status.className = "empty-state";
    status.style.marginBottom = "16px";
    pageEl.insertBefore(status, nav);
  }

  if (!header || !nav) {
    return { header, nav, status, actions };
  }

  if (!document.getElementById("drive-connect-btn")) {
    const connectButton = document.createElement("button");
    connectButton.id = "drive-connect-btn";
    connectButton.type = "button";
    connectButton.className = "year-btn";
    connectButton.textContent = "Connect Google Drive";
    connectButton.addEventListener("click", () => requestDriveAccess(status));
    actions.appendChild(connectButton);
  }

  return { header, nav, status, actions };
};

const requestDriveAccess = (statusEl) => {
  if (!tokenClient) {
    setStatus(statusEl, "Google Drive is not initialized yet.", "error");
    return;
  }

  tokenClient.callback = async (response) => {
    if (response.error) {
      setStatus(statusEl, "Drive access was not granted.", "error");
      return;
    }

    accessToken = response.access_token;
    gapi.client.setToken({ access_token: accessToken });
    driveClientReady = true;
    setStatus(statusEl, "Google Drive connected. Loading photos...", "success");

    yearCache = new Map();
    await loadYear(currentYear, statusEl);
  };

  tokenClient.requestAccessToken({ prompt: "consent" });
};

const loadYear = async (year, statusEl) => {
  if (!isTeamsPhotoPage()) {
    return;
  }

  const grid = document.querySelector("#photo-grid");
  const heading = document.querySelector("#year-heading");
  const nav = document.querySelector("#years-nav");

  if (!grid || !heading || !nav) {
    return;
  }

  currentYear = year;
  heading.textContent = `Photos · ${year}`;
  updateYearButtons(nav, year);

  const requestId = ++activeRequestId;
  grid.innerHTML = "";
  const loadingCard = document.createElement("article");
  loadingCard.className = "empty-state";
  loadingCard.textContent = `Loading ${year} photos from Google Drive...`;
  grid.appendChild(loadingCard);

  try {
    if (!driveClientReady) {
      renderCards(grid, year, []);
      setStatus(statusEl, "Connect Google Drive to load the folder photos.", "info");
      return;
    }

    const photos = await fetchDriveImagesForYear(year);
    if (requestId !== activeRequestId) {
      return;
    }

    renderCards(grid, year, photos);
    setStatus(statusEl, photos.length ? `Loaded ${photos.length} photo${photos.length === 1 ? "" : "s"} for ${year}.` : `No photos found for ${year}.`, photos.length ? "success" : "info");
  } catch (error) {
    if (requestId !== activeRequestId) {
      return;
    }
    renderCards(grid, year, []);
    setStatus(statusEl, `Could not load ${year} photos: ${error.message}`, "error");
  }
};

const initGoogleDrive = async (statusEl) => {
  await ensureGoogleLibraries();

  await new Promise((resolve, reject) => {
    gapi.load("client", async () => {
      try {
        await gapi.client.init({
          discoveryDocs: [DRIVE_DISCOVERY_DOC],
        });

        if (GOOGLE_OAUTH_CLIENT_ID.startsWith("YOUR_")) {
          setStatus(
            statusEl,
            "Set GOOGLE_OAUTH_CLIENT_ID and folder IDs in team-photo.js, then connect Google Drive.",
            "info",
          );
          resolve();
          return;
        }

        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_OAUTH_CLIENT_ID,
          scope: DRIVE_READONLY_SCOPE,
          callback: () => {},
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
};

const initGallery = async () => {
  if (!isTeamsPhotoPage()) {
    return;
  }

  const page = document.querySelector("#photos-page");
  const nav = document.querySelector("#years-nav");
  const heading = document.querySelector("#year-heading");
  const grid = document.querySelector("#photo-grid");

  if (!page || !nav || !heading || !grid) {
    return;
  }

  const { status } = buildGalleryShell(page);
  const years = buildYearList();

  nav.innerHTML = "";
  years.forEach((year) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "year-btn";
    btn.dataset.year = year;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", "false");
    btn.textContent = year;
    btn.addEventListener("click", () => loadYear(year, status));
    nav.appendChild(btn);
  });

  setStatus(status, "Initializing Google Drive connection...", "info");

  try {
    await initGoogleDrive(status);
  } catch (error) {
    setStatus(status, `Google Drive failed to initialize: ${error.message}`, "error");
  }

  updateYearButtons(nav, currentYear);
  await loadYear(currentYear, status);
};

document.addEventListener("DOMContentLoaded", initGallery);
