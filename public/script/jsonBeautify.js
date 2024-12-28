class Utility {
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static async getRemoteJson(url) {
    for (let retry = 0; retry < 3; retry++) {
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        if (retry === 0 && error.code === "ERR_NETWORK") {
          url = `https://cors-anywhere.herokuapp.com/${url}`;
        }
      }
    }
    return `Unable to fetch data. Please check ${url}.`;
  }

  static bindEvent(element, eventType, handler) {
    if (element) {
      element.addEventListener(eventType, handler);
    }
  }
}
class DatabaseHandler {
  constructor(storeName) {
    this.storeName = storeName;
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("myDatabase", 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async executeDBOperation(data, operation) {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);

      const operations = {
        add: () => store.add(data),
        put: () => store.put(data),
        delete: () => store.delete(data.id),
      };

      if (!operations[operation]) {
        throw new Error(`Unsupported operation: ${operation}`);
      }

      const request = operations[operation]();
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          if (operation === "add") data.id = event.target.result;
          resolve(data);
        };
        request.onerror = (event) => reject(event.target.error);
      });
    } catch (error) {
      console.error(`Error during ${operation} operation:`, error);
      throw error;
    }
  }

  async loadData() {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      });
    } catch (error) {
      console.error("Error loading data from DB:", error);
      return [];
    }
  }
}
const dbHandler = new DatabaseHandler("jsonStore");

const newData = (container) => ({
  url: "",
  container,
  content: `{"now": "${new Date().toISOString()}"}`,
  lastUpdate: new Date().toISOString(),
});

const loadObject = (eventTarget) => {
  const container = eventTarget.closest(".p-4");
  return Object.fromEntries(
    ["viewer", "editor", "data"].map((key) => [key, container.querySelector(`.${key}`)])
  );
};

const updateJsonDisplay = (targetElement, jsonString) => {
  try {
    const parsedJson = JSON.parse(jsonString);
    targetElement.innerHTML = prettyPrintJson.toHtml(parsedJson, {
      linkUrls: true,
      quoteKeys: true,
      trailingCommas: false,
    });
  } catch {
    targetElement.textContent = `Invalid JSON: ${jsonString}`;
  } finally {
    targetElement.setAttribute("data-json", jsonString.trim());
  }
};

const toggleModes = (viewer, editor, showEditor) => {
  viewer.classList.toggle("hidden", showEditor);
  editor.classList.toggle("hidden", !showEditor);
};

const modeEditor = (event) => {
  const { viewer, editor, data } = loadObject(event.target);
  if (!viewer || !editor || !data) return;

  editor.querySelector("sl-textarea").value = data.getAttribute("data-json");
  toggleModes(viewer, editor, true);
  editor.querySelector("sl-textarea").focus();
};

const modeViewer = async (event) => {
  if (event.key !== "Enter" || event.shiftKey) return;

  event.preventDefault();
  const { viewer, editor, data } = loadObject(event.target);
  if (!viewer || !editor || !data) return;

  const updatedData = {
    id: parseInt(data.getAttribute("data-id"), 10),
    url: "",
    container: data.getAttribute("data-container"),
    lastUpdate: new Date().toISOString(),
  };

  let updatedContent = editor.querySelector("sl-textarea").value;
  if (updatedContent && Utility.isValidUrl(updatedContent)) {
    updatedData.url = updatedContent;
    updatedContent = JSON.stringify(await Utility.getRemoteJson(updatedContent));
  }

  updateJsonDisplay(data, updatedContent);
  updatedData.content = updatedContent;
  await dbHandler.executeDBOperation(updatedData, "put");

  toggleModes(viewer, editor, false);
};

const renderComponent = (data, containerName) => {
  const template = document.getElementById("template").content.cloneNode(true);
  updateJsonDisplay(template.querySelector(".data"), data.content);
  template.querySelector("sl-relative-time").setAttribute("date", data.lastUpdate);

  const container = document.createElement("div");
  container.classList.add("p-4");
  container.appendChild(template);

  setupButton(container.querySelector(".fetch-button"), async () => {
    data.content = JSON.stringify(await Utility.getRemoteJson(data.url));
    await dbHandler.executeDBOperation(data, "put");
    updateJsonDisplay(container.querySelector(".data"), data.content);
  }, data.url && Utility.isValidUrl(data.url));

  setupButton(container.querySelector(".delete-button"), async () => {
    await dbHandler.executeDBOperation({ id: data.id }, "delete");
    container.remove();
  });

  setupEditorAndViewer(container);

  container.querySelector(".data").setAttribute("data-id", data.id);
  container.querySelector(".data").setAttribute("data-container", containerName);
  document.getElementById(`${containerName}-container`).appendChild(container);
};

const setupButton = (button, handler, condition = true) => {
  if (condition) {
    button.classList.remove("hidden");
    Utility.bindEvent(button, "click", handler);
  } else {
    button.classList.add("hidden");
  }
};

const setupEditorAndViewer = (container) => {
  const card = container.querySelector(".card-overview");
  Utility.bindEvent(card, "dblclick", modeEditor);

  const textarea = container.querySelector("sl-textarea");
  Utility.bindEvent(textarea, "keydown", modeViewer);
};

const init = async () => {
  const allData = await dbHandler.loadData();

  ["left", "middle"].forEach((name) => {
    document.getElementById(`${name}-add`).addEventListener("click", async () => {
      const data = newData(name);
      await dbHandler.executeDBOperation(data, "add");
      renderComponent(data, name);
    });

    allData.filter((item) => item.container === name)
      .forEach((data) => renderComponent(data, name));
  });
};

init();