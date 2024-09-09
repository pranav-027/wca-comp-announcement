const axios = require('axios');
const cheerio = require('cheerio');
const { DateTime } = require('luxon');
const Globalize = require("globalize");

// Load only the necessary CLDR data for the English locale
Globalize.load(
  require("cldr-data/main/en/numbers.json"),
  require("cldr-data/main/en/currencies.json"),
  require("cldr-data/supplemental/currencyData.json"),
  require("cldr-data/supplemental/likelySubtags.json"),
  require("cldr-data/supplemental/numberingSystems.json")
);

// Set the default locale to 'en'
Globalize.locale("en");


const eventsDict = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333bf": "3x3 BLD",
  "333fm": "3x3 FMC",
  "333oh": "3x3 OH",
  "clock": "Clock",
  "minx": "Megaminx",
  "pyram": "Pyraminx",
  "skewb": "Skewb",
  "sq1": "Square-1",
  "444bf": "4x4 BLD",
  "555bf": "5x5 BLD",
  "333mbf": "3x3 MBLD",
};

// Function to generate Google Maps link
function generateGoogleMapsLink(latitude, longitude) {
  return `https://www.google.com/maps/?q=${latitude},${longitude}`;
}

function formatCurrency(value, currencyCode) {
  const formatter = Globalize.currencyFormatter(currencyCode);
  return formatter(value);
}

// Function to fetch competition data
async function fetchCompetitionData(apiUrl) {
  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error(`Error fetching competition data: ${error}`);
    return null;
  }
}

// Function to fetch contact link
async function fetchContactLink(compUrl) {
  try {
    const response = await axios.get(compUrl);
    const $ = cheerio.load(response.data);
    let contactLink = $("dt:contains('Contact')").next().find("a").attr("href");

    if (contactLink.startsWith("/")) {
      contactLink = "https://www.worldcubeassociation.org" + contactLink;
    } else if (contactLink.includes("mailto:")) {
      contactLink = contactLink.replace("mailto:", "");
    } else {
      contactLink = compUrl;
    }

    return contactLink;
  } catch (error) {
    console.error(`Error fetching contact link: ${error}`);
    return compUrl;
  }
}

// Function to format date range
function formatDateRange(startDate, endDate) {
  const start = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);

  if (startDate === endDate) {
    return start.toLocaleString(DateTime.DATE_FULL) + ` | ${start.toFormat('cccc')}`;
  }

  return `${start.toFormat('MMMM dd')}-${end.toFormat('dd, yyyy')} | ${start.toFormat('ccc')}-${end.toFormat('ccc')}`;
}

// Function to generate WhatsApp competition message
async function getCompetitionMessage(competitionUrl) {
  const apiUrl = competitionUrl.replace('/competitions/', '/api/v0/competitions/');
  const comp = await fetchCompetitionData(apiUrl);

  if (!comp) return "";

  const compUrl = comp.url;
  const compOrganizers = comp.organizers.map(organizer => organizer.name).join(", ");
  const compDate = formatDateRange(comp.start_date, comp.end_date);
  const compVenueAndDetails = comp.venue_details ? `${comp.venue_address} | ${comp.venue_details}` : comp.venue_address;
  const compVenueLink = generateGoogleMapsLink(comp.latitude_degrees, comp.longitude_degrees);
  const compEvents = comp.event_ids.map(event => eventsDict[event]).join(", ");
  const compLimit = comp.competitor_limit ? comp.competitor_limit : "Unlimited";
  const compFee = comp.base_entry_fee_lowest_denomination ? formatCurrency((comp.base_entry_fee_lowest_denomination / 100), comp.currency_code) : "No registration fee";
  const regStartsFrom = DateTime.fromISO(comp.registration_open).setZone('Asia/Kolkata').toFormat("EEE | MMMM dd, yyyy 'at' hh:mm a");
  const contactLink = await fetchContactLink(compUrl);

  return (
    `*Competition Announcement*\n${compUrl}\n\n` +
    `*Organizers:*\n${compOrganizers}\n\n` +
    `*Date:*\n${compDate}\n\n` +
    `*Venue:*\n${compVenueAndDetails}\n${compVenueLink}\n\n` +
    `*Events:*\n${compEvents}\n\n` +
    `*Competitor Limit:*\n${compLimit}\n\n` +
    `*Base Registration Fee:*\n${compFee}\n\n` +
    `*Registration Starts From:*\n${regStartsFrom}\n\n` +
    `*Contact:*\n${contactLink}\n`
  );
}

// Function to generate Facebook competition message
async function getCompetitionFbMessage(competitionUrl) {
  const apiUrl = competitionUrl.replace('/competitions/', '/api/v0/competitions/');
  const comp = await fetchCompetitionData(apiUrl);

  if (!comp) return "";

  const compDate = formatDateRange(comp.start_date, comp.end_date);
  const compVenueAndDetails = comp.venue_details ? `${comp.venue_address} | ${comp.venue_details}` : comp.venue_address;
  const compEvents = comp.event_ids.map(event => eventsDict[event]).join(", ");
  const compLimit = comp.competitor_limit ? comp.competitor_limit : "Unlimited";
  const regStartsFrom = DateTime.fromISO(comp.registration_open).setZone('Asia/Kolkata').toFormat("EEE | MMMM dd, yyyy 'at' hh:mm a");

  return (
    `[Competition Announcement]\n\n${comp.name}\n\n` +
    `Date:\n${compDate}\n\n` +
    `Venue:\n${compVenueAndDetails}\n\n` +
    `Events:\n${compEvents}\n\n` +
    `Competitor Limit:\n${compLimit}\n\n` +
    `Registration Starts From:\n${regStartsFrom}\n\n` +
    `Happy Cubing! 🧩\n\n${comp.url}\n`
  );
}

module.exports = { getCompetitionMessage, getCompetitionFbMessage };
