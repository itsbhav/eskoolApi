const { google } = require('googleapis');
const fs=require("fs")
const getDriveService = () => {
  const SCOPES = ["https://www.googleapis.com/auth/drive"];
  const SERVICE_ACC_CRE = {
    type: process.env.TYPE,
    project_id: process.env.PID,
    private_key_id: process.env.GPKEY,
    private_key: process.env.GKEY.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.CERT_PROVIDER,
    client_x509_cert_url: process.env.CL_CERT_P,
    universe_domain: process.env.UN_DOMAIN
  };
  // console.log("grkgkl")
  const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACC_CRE,
    scopes: SCOPES,
  });
  // console.log(auth)
  const driveService = google.drive({ version: "v3", auth });
  // console.log("ffjkfejk")
  return driveService;
};

const uploadSingleFile = async (fileName, filePath, folderId,fileMime) => {
  const drive = getDriveService()
  // console.log(drive)
  try {
    const { data: { id, name, webViewLink } = {} } = await drive.files.create({
      resource: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: fileMime,
        body: fs.createReadStream(filePath),
      },
      fields: 'id,name,webViewLink',
    });
    // console.log('File Uploaded', name, id);
    await drive.permissions.create({
    fileId: id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
    });
    return webViewLink;
  } catch (err) {
    console.log(err)
  }
};
  
const deleteFile = async (fileId) => {
  const drive = getDriveService()
  try {
    await drive.files.delete({
      fileId,
    });
  } catch (err) {
    console.log(err)
  }
}

module.exports = { getDriveService, uploadSingleFile,deleteFile };
