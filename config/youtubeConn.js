const { google } = require("googleapis");
const { CLIENT_IDY, CLIENT_SECRET, REDIRECT_URI } = process.env;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_IDY,
  CLIENT_SECRET,
  REDIRECT_URI
);

const setCreadentials = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope:
      "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtubepartner",
  });
  return res.json({ url: authUrl });
};

const getToken = (req, res) => {
  const code = req.query.code;
  if (code) {
    oauth2Client.getToken(code, (err, token) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Some unexpected error occured" });
      else {
        res.cookie("auth2", token, {
          httpOnly: true, //accessible only by web server
          secure: true, //https
          sameSite: "None", //cross-site cookie
          maxAge: 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
          // partitioned: true,
        });
        return res.redirect(process.env.FRONTEND_HOST);
      }
    });
  }
};

const uploadVideo = async (req, res) => {
  const { cookies } = req;
  if (!cookies) return res.status(400).json({ message: "Unauthorized" });
  const { auth2 } = cookies;
  if (!auth2) return res.status(400).json({ message: "Unauthorized" });
  return res.json({ auth: auth2.access_token });
};

const addToPlaylist = async (req, res, next) => {
  const { cookies } = req;
  if (!cookies) return res.status(400).json({ message: "Unauthorized" });
  const { auth2 } = cookies;
  if (!auth2) return res.status(400).json({ message: "Unauthorized" });
  const { playlistId, videoId } = req.body;
  if (!playlistId || !videoId)
    return res.status(400).json({ message: "Data Missing" });
  oauth2Client.setCredentials({ access_token:auth2.access_token});
  try {
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const params = {
      part: "snippet",
      requestBody: {
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId: videoId,
          },
        },
      },
    };
    // console.log("hiiiiiii")
    const data = await youtube.playlistItems.insert(params);
    // console.log(data);
    return res.status(200).json({ message: "Added to playlist successfully." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Some error occured" });
  }
};

module.exports = {
  uploadVideo,
  getToken,
  setCreadentials,
  addToPlaylist,
};
