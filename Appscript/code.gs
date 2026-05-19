// ============================================
// FixMyCity — Google Apps Script (Middleware)
// Deploy as: Web App → Execute as ME → Anyone can access
//
// This script receives base64 file data from the backend,
// saves it to Google Drive, makes it PUBLIC, and returns the fileId.
//
// CRITICAL: The backend (drive.js) builds the embeddable URL as:
//   Images: https://lh3.googleusercontent.com/d/{fileId}
//   Videos: https://drive.google.com/file/d/{fileId}/preview
//
// So this script only needs to return { success: true, fileId: "..." }
// ============================================

// ---- CONFIGURE THIS ----
// Create a folder in your Drive and paste its ID here.
// (Open the folder in Drive → the ID is the last part of the URL)
const FOLDER_ID = 'YOUR-FOLDER-ID-HERE';
// -------------------------

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ---- Handle delete action ----
    if (data.action === 'delete' && data.fileId) {
      try {
        DriveApp.getFileById(data.fileId).setTrashed(true);
      } catch (err) {
        // Non-fatal — file may already be deleted
      }
      return jsonResponse({ success: true });
    }

    // ---- Handle upload ----
    const { fileName, mimeType, base64Data } = data;
    if (!fileName || !mimeType || !base64Data) {
      return jsonResponse({ success: false, error: 'Missing fileName, mimeType, or base64Data' });
    }

    // Decode base64 → bytes
    const bytes = Utilities.base64Decode(base64Data);
    const blob  = Utilities.newBlob(bytes, mimeType, fileName);

    // Save to the configured folder
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file   = folder.createFile(blob);

    // ✅ CRITICAL: Make the file publicly readable
    // Without this, the lh3.googleusercontent.com/d/{id} URL returns 403
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();

    // Return only the fileId — backend builds the embeddable URL
    return jsonResponse({ success: true, fileId });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Test function (run manually in Apps Script editor to verify) ----
function testUpload() {
  // Creates a tiny 1x1 red PNG and uploads it
  const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
  const e = { postData: { contents: JSON.stringify({ fileName: 'test.png', mimeType: 'image/png', base64Data: testBase64 }) } };
  const result = JSON.parse(doPost(e).getContent());
  Logger.log(result);
  if (result.success) {
    Logger.log('Embeddable URL: https://lh3.googleusercontent.com/d/' + result.fileId);
  }
}
