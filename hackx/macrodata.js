const emptyBins = [
  {WO: 0, FC: 0, DR: 0, MA: 0},
  {WO: 0, FC: 0, DR: 0, MA: 0},
  {WO: 0, FC: 0, DR: 0, MA: 0},
  {WO: 0, FC: 0, DR: 0, MA: 0},
  {WO: 0, FC: 0, DR: 0, MA: 0}
];

class MacrodataFile {
  constructor() {
    this.localStorageKey = 'hackx-data';
    const file = JSON.parse(localStorage.getItem(this.localStorageKey)) ?? this.assignFile();
    this.fileName = file.fileName;
    this.storedBins = file.storedBins;
    this.coordinates = file.coordinates;
  }

  assignFile() {
    const names = HACKX_CONFIG.projectNames;
    const allButPrevious = names.filter(f => f !== this.fileName);
    const fileName = allButPrevious[Math.floor(Math.random() * allButPrevious.length)];
    const coordinates = this.#generateCoordinates();
    const macrodata = {
      fileName,
      storedBins: emptyBins,
      coordinates
    };
    localStorage.setItem(this.localStorageKey, JSON.stringify(macrodata));
    return macrodata;
  }

  updateProgress(bins) {
    const updatedFile = {
      fileName: this.fileName,
      storedBins: bins,
      coordinates: this.coordinates
    };
    localStorage.setItem(this.localStorageKey, JSON.stringify(updatedFile));
  }

  resetFile() {
    localStorage.removeItem(this.localStorageKey);
    const file = this.assignFile();
    this.fileName = file.fileName;
    this.storedBins = file.storedBins;
    this.coordinates = file.coordinates;
  }

  #generateCoordinates() {
    function randHex() {
      return floor(random(0, 256)).toString(16).toUpperCase().padStart(2, '0');
    }
    let x = randHex() + randHex() + randHex();
    let y = randHex() + randHex() + randHex();
    return `0x${x} : 0x${y}`;
  }
}
