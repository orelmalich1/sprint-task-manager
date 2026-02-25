/**
 * Google Apps Script for Two-Way Sync with Sprint Task Manager
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click Deploy → New deployment
 * 5. Choose "Web app" type
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone" (this is safe, they need the URL)
 * 8. Click Deploy and copy the Web App URL
 * 9. Use this URL in your React app
 */

// Configuration
const TASKS_SHEET_NAME = 'Tasks';
const DEVELOPERS_SHEET_NAME = 'Developers';

/**
 * Handle GET requests - Read data from sheets
 */
function doGet(e)
  try {
    const action = e.parameter.action;

    if (action === 'getTasks') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: getTasks()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getDevelopers') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: getDevelopers()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getAll') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        tasks: getTasks(),
        developers: getDevelopers()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - Write data to sheets
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'updateTasks') {
      updateTasks(data.tasks);
      return ContentService.createTextOutput(JSON.stringify({
        success: true
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'updateDevelopers') {
      updateDevelopers(data.developers);
      return ContentService.createTextOutput(JSON.stringify({
        success: true
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'syncAll') {
      updateTasks(data.tasks);
      updateDevelopers(data.developers);
      return ContentService.createTextOutput(JSON.stringify({
        success: true
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all tasks from Tasks sheet
 */
function getTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TASKS_SHEET_NAME);

  if (!sheet) {
    // Create Tasks sheet if it doesn't exist
    sheet = ss.insertSheet(TASKS_SHEET_NAME);
    sheet.appendRow(['Task', 'Developer', 'Quarter', 'Start Sprint', 'Duration', 'Color', 'ID']);
    return [];
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only header or empty

  const tasks = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Has title
      tasks.push({
        id: row[6] || `task-${Date.now()}-${i}`,
        title: row[0],
        developer: row[1],
        quarter: row[2],
        startSprint: parseFloat(row[3]),
        duration: parseFloat(row[4]),
        color: row[5] || '#3B82F6'
      });
    }
  }

  return tasks;
}

/**
 * Get all developers from Developers sheet
 */
function getDevelopers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DEVELOPERS_SHEET_NAME);

  if (!sheet) {
    // Create Developers sheet if it doesn't exist
    sheet = ss.insertSheet(DEVELOPERS_SHEET_NAME);
    sheet.appendRow(['Name', 'Quarter', 'Start Date', 'End Date', 'ID']);
    return [];
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only header or empty

  const developers = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Has name
      developers.push({
        id: row[4] || `dev-${Date.now()}-${i}`,
        name: row[0],
        quarter: row[1],
        startDate: row[2] ? formatDate(row[2]) : null,
        endDate: row[3] ? formatDate(row[3]) : null
      });
    }
  }

  return developers;
}

/**
 * Update Tasks sheet with new data
 */
function updateTasks(tasks) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TASKS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(TASKS_SHEET_NAME);
  }

  // Clear existing data
  sheet.clear();

  // Write header
  sheet.appendRow(['Task', 'Developer', 'Quarter', 'Start Sprint', 'Duration', 'Color', 'ID']);

  // Write tasks
  tasks.forEach(task => {
    sheet.appendRow([
      task.title,
      task.developer,
      task.quarter || '',
      task.startSprint,
      task.duration,
      task.color,
      task.id
    ]);
  });

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, 7);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1e40af');
  headerRange.setFontColor('#ffffff');
}

/**
 * Update Developers sheet with new data
 */
function updateDevelopers(developers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DEVELOPERS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DEVELOPERS_SHEET_NAME);
  }

  // Clear existing data
  sheet.clear();

  // Write header
  sheet.appendRow(['Name', 'Quarter', 'Start Date', 'End Date', 'ID']);

  // Write developers
  developers.forEach(dev => {
    sheet.appendRow([
      dev.name,
      dev.quarter || '',
      dev.startDate || '',
      dev.endDate || '',
      dev.id
    ]);
  });

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, 5);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1e40af');
  headerRange.setFontColor('#ffffff');
}

/**
 * Helper function to format dates
 */
function formatDate(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
