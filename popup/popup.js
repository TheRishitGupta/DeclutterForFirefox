document.addEventListener("DOMContentLoaded", () => {

  const button = document.getElementById("mybutton");

  const resultText = document.getElementById("result");
  const toggles = {
  google: document.getElementById("toggle-google"),
  youtube: document.getElementById("toggle-youtube"),
  reddit: document.getElementById("toggle-reddit")
};
chrome.storage.sync.get(
  { google: true, youtube: true, reddit: true },
  (settings) => {
    toggles.google.checked = settings.google;
    toggles.youtube.checked = settings.youtube;
    toggles.reddit.checked = settings.reddit;
  }
);
Object.keys(toggles).forEach((key) => {
  toggles[key].addEventListener("change", () => {
    chrome.storage.sync.set({
      [key]: toggles[key].checked
    });
  });
});



  button.addEventListener("click", () => {



    resultText.textContent = "Working...";


    chrome.runtime.sendMessage(

      { action: "DECLUTTER_NOW" },

      (response) => {

        if (chrome.runtime.lastError) {

          resultText.textContent = "Something went wrong.";

          return;

        }



        if (response && response.closedCount !== undefined) {

          if (response.closedCount === 0) {

            resultText.textContent = "No unnecessary tabs found. ✅";

          } else {

            resultText.textContent = `Closed ${response.closedCount} tab(s).`;

          }
        }
      }
    );
  });
});
