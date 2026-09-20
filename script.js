const reelUrl = document.getElementById("reelUrl");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const message = document.getElementById("message");

function showMessage(text) {
    message.textContent = text;
}

function isInstagramUrl(url) {
    try {
        const parsed = new URL(url);

        return (
            parsed.hostname === "instagram.com" ||
            parsed.hostname === "www.instagram.com"
        );
    } catch {
        return false;
    }
}

downloadBtn.addEventListener("click", async () => {
    const url = reelUrl.value.trim();

    showMessage("");

    if (!url) {
        showMessage("Please paste an Instagram Reel URL.");
        return;
    }

    if (!isInstagramUrl(url)) {
        showMessage("Please enter a valid Instagram URL.");
        return;
    }

    downloadBtn.disabled = true;
    downloadBtn.textContent = "Checking...";

    try {
        const response = await fetch("/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: url
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            showMessage(
                data.message || "Unable to process this Reel."
            );
            return;
        }

        showMessage("Video is ready.");

        const link = document.createElement("a");

        link.href = data.videoUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = "reel.mp4";

        link.textContent = "⬇ Download Video";

        link.style.display = "inline-block";
        link.style.marginTop = "15px";
        link.style.padding = "12px 20px";
        link.style.borderRadius = "8px";
        link.style.background = "#ff3b81";
        link.style.color = "#ffffff";
        link.style.textDecoration = "none";

        message.appendChild(document.createElement("br"));
        message.appendChild(link);

    } catch (error) {
        console.error(error);

        showMessage(
            "Server connection failed. Make sure the backend is running."
        );
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = "⬇ Download Reel";
    }
});

clearBtn.addEventListener("click", () => {
    reelUrl.value = "";
    showMessage("");
    reelUrl.focus();
});

reelUrl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        downloadBtn.click();
    }
});