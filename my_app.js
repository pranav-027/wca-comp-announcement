const axios = require("axios");
const { DateTime } = require("luxon");
const Globalize = require("globalize");
const {RestrictionError} = require("./utils/errors")

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

const INVALID_ID = 5703;

const eventsDict = {
  333: "3x3",
  222: "2x2",
  444: "4x4",
  555: "5x5",
  666: "6x6",
  777: "7x7",
  "333bf": "3x3 BLD",
  "333fm": "3x3 FMC",
  "333oh": "3x3 OH",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  "444bf": "4x4 BLD",
  "555bf": "5x5 BLD",
  "333mbf": "3x3 MBLD",
};

function checkCompURL(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    throw new Error("Invalid URL: Please provide a valid URL.");
  }
}
//temporary
function restrictionCheck(obj) {
    const organizers = obj.organizers;
    if (organizers.find(organizer => organizer.id === INVALID_ID)) {
      throw new RestrictionError("Not Allowed");
    }
}

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
    const response = await axios.get(apiUrl);
    restrictionCheck(response.data);
    return response.data;
}

function extractEmail(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailRegex);

  if (match) {
    return match[0];
  } else {
    return text;
  }
}

function generateContactLink(competitionId) {
  const baseURL = "https://www.worldcubeassociation.org/contact";
  const contactRecipient = "competition";
  return `${baseURL}?competitionId=${competitionId}&contactRecipient=${contactRecipient}`;
}

// Function to format date range
function formatDateRange(startDate, endDate) {
  const start = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);

  if (startDate === endDate) {
    return (
      start.toLocaleString(DateTime.DATE_FULL) + ` | ${start.toFormat("cccc")}`
    );
  }

  return `${start.toFormat("MMMM dd")}-${end.toFormat(
    "dd, yyyy"
  )} | ${start.toFormat("ccc")}-${end.toFormat("ccc")}`;
}

// Helper function to fetch and format common competition data
async function getFormattedCompetitionData(competitionUrl) {
  checkCompURL(competitionUrl);
  const apiUrl = competitionUrl.replace(
    "/competitions/",
    "/api/v0/competitions/"
  );
  const comp = await fetchCompetitionData(apiUrl);

  if (!comp) return null;

  const compName = comp.name;
  const compOrganizers = comp.organizers
    .map((organizer) => organizer.name)
    .join(", ");
  const compDate = formatDateRange(comp.start_date, comp.end_date);
  const compVenueAndDetails = comp.venue_details
    ? `${comp.venue_address} | ${comp.venue_details}`
    : comp.venue_address;
  const compVenueLink = generateGoogleMapsLink(
    comp.latitude_degrees,
    comp.longitude_degrees
  );
  const compEvents = comp.event_ids
    .map((event) => eventsDict[event])
    .join(", ");
  const compLimit = comp.competitor_limit ? comp.competitor_limit : "Unlimited";
  const compFee = comp.base_entry_fee_lowest_denomination
    ? formatCurrency(
        comp.base_entry_fee_lowest_denomination / 100,
        comp.currency_code
      )
    : "No registration fee";
  const regStartsFrom = DateTime.fromISO(comp.registration_open)
    .setZone("Asia/Kolkata")
    .toFormat("EEE | MMMM dd, yyyy 'at' hh:mm a");
  const contactLink = comp.contact
    ? extractEmail(comp.contact)
    : generateContactLink(comp.id);

  return {
    comp,
    compName,
    compOrganizers,
    compDate,
    compVenueAndDetails,
    compVenueLink,
    compEvents,
    compLimit,
    compFee,
    regStartsFrom,
    contactLink,
  };
}

// Function to generate a competition announcement message
async function getCompetitionMessage(competitionUrl) {
  const compData = await getFormattedCompetitionData(competitionUrl);

  if (!compData) return "";

  return (
    `*Competition Announcement*\n${competitionUrl}\n\n` +
    `*Organizers:*\n${compData.compOrganizers}\n\n` +
    `*Date:*\n${compData.compDate}\n\n` +
    `*Venue:*\n${compData.compVenueAndDetails}\n${compData.compVenueLink}\n\n` +
    `*Events:*\n${compData.compEvents}\n\n` +
    `*Competitor Limit:*\n${compData.compLimit}\n\n` +
    `*Base Registration Fee:*\n${compData.compFee}\n\n` +
    `*Registration Starts From:*\n${compData.regStartsFrom}\n\n` +
    `*Contact:*\n${compData.contactLink}\n`
  );
}

// Function to generate Facebook competition message
async function getCompetitionFbMessage(competitionUrl) {
  const compData = await getFormattedCompetitionData(competitionUrl);

  if (!compData) return "";

  return (
    `[Competition Announcement]\n\n${compData.comp.name}\n\n` +
    `Date:\n${compData.compDate}\n\n` +
    `Venue:\n${compData.compVenueAndDetails}\n\n` +
    `Events:\n${compData.compEvents}\n\n` +
    `Competitor Limit:\n${compData.compLimit}\n\n` +
    `Registration Starts From:\n${compData.regStartsFrom}\n\n` +
    `Happy Cubing! 🧩\n\n${compData.comp.url}\n`
  );
}

// Function to generate Markdown competition message
async function getMarkdownMessage(competitionUrl) {
    const compData = await getFormattedCompetitionData(competitionUrl);

  if (!compData) return "";
    
  return(
    `## Competition Announcement\n` +
    `### ${compData.compName}\n\n` +
    `**Organizers:**\n${compData.compOrganizers}\n\n` +
    `**Date:**\n${compData.compDate}\n\n` +
    `**Venue:**\n${compData.compVenueAndDetails}\n${compData.compVenueLink}\n\n` +
    `**Events:**\n${compData.compEvents}\n\n` +
    `**Competitor Limit:**\n${compData.compLimit}\n\n` +
    `**Registration Starts From:**\n${compData.regStartsFrom}\n\n` +
    `${competitionUrl}`
  );
}


module.exports = { getCompetitionMessage, getCompetitionFbMessage, getMarkdownMessage};
