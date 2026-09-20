require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});


// ===============================
// GET VIDEO URL FROM INSTAGRAM API
// ===============================
app.post("/download", async (req, res) => {

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            success: false,
            message: "Instagram URL is required."
        });
    }

    if (!url.includes("instagram.com")) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid Instagram URL."
        });
    }

    if (!process.env.INSTAGRAMAPI_KEY) {
        return res.status(500).json({
            success: false,
            message: "API key is not configured."
        });
    }

    try {

        const apiResponse = await fetch(
            `https://api.instagramapi.dev/v1/post?post=${encodeURIComponent(url)}`,
            {
                headers: {
                    "Authorization":
                        `Bearer ${process.env.INSTAGRAMAPI_KEY}`
                }
            }
        );

        const data = await apiResponse.json();

        console.log("Instagram API response:", data);

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({
                success: false,
                message:
                    data?.error?.message ||
                    "Instagram API request failed."
            });
        }

        const videoUrl = data?.data?.video_url;

        if (!videoUrl) {
            return res.status(400).json({
                success: false,
                message:
                    "No video was found. Make sure this is a public video Reel."
            });
        }

        // Give browser our own download URL
        const downloadUrl =
            `/download-file?video=${encodeURIComponent(videoUrl)}`;

        res.json({
            success: true,
            videoUrl: downloadUrl
        });

    } catch (error) {

        console.error("API ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
});


// ===============================
// PROXY VIDEO TO BROWSER
// ===============================
app.get("/download-file", async (req, res) => {

    const videoUrl = req.query.video;

    if (!videoUrl) {
        return res.status(400).send("Video URL is missing.");
    }

    try {

        const videoResponse = await fetch(videoUrl);

        if (!videoResponse.ok) {
            return res.status(502).send(
                "Unable to fetch video from source."
            );
        }

        res.setHeader(
            "Content-Type",
            videoResponse.headers.get("content-type") ||
            "video/mp4"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="reel.mp4"'
        );

        if (videoResponse.body) {
            const { Readable } = require("stream");

            Readable.fromWeb(videoResponse.body).pipe(res);
        } else {
            res.status(500).send("Video stream unavailable.");
        }

    } catch (error) {

        console.error("VIDEO DOWNLOAD ERROR:", error);

        res.status(500).send(
            "Unable to download video."
        );
    }
});


const PORT = 3000;

app.listen(PORT, () => {
    console.log(
        `Server running: http://localhost:${PORT}`
    );
});