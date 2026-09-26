// Completion includes fields supported by the profile API.
const isProfessionalRole = (role) => ['doctor', 'consultant', 'counselor', 'counsellor', 'counsellour'].includes(String(role || '').trim().toLowerCase());

const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const hasItems = (value) => Array.isArray(value) && value.some(hasText);
const hasPhoto = (value) => hasText(value) || hasText(value?.url) || hasText(value?.secure_url) || hasText(value?.path);

// Percentages describe persisted required fields, never a caller-supplied flag.
export const getProfileCompletion = (data = {}) => {
  const dob = getAgeFromDateOfBirth(data.dateOfBirth);
  const address = data.address || {};
  const checks = [
    ["fullName", "Full name", hasText(data.fullName)],
    ["email", "Email", hasText(data.email)],
    ["phoneNumber", "Valid phone number", normalizePhoneNumber(data.phoneNumber, data.phoneCountryCode, true).isValid],
    ["profilePhoto", "Profile photo", hasPhoto(data.profilePhoto)],
    ["dateOfBirth", "Valid date of birth", dob.valid && dob.age !== null],
    ["gender", "Gender", hasText(data.gender)],
    ...["line1", "city", "state", "pincode", "country"].map((key) => [
      `address.${key}`, `Address: ${key === "line1" ? "street" : key}`, hasText(address[key]),
    ]),
  ];
  if (isProfessionalRole(data.role)) {
    checks.push(
      ["specialization", "At least one specialization", hasItems(data.specialization)],
      ["experience", "Experience (0 or more years)", data.experience !== null && data.experience !== undefined && String(data.experience).trim() !== "" && Number.isFinite(Number(data.experience)) && Number(data.experience) >= 0],
      ["qualification", "Qualification or education", hasText(data.qualification) || hasText(data.education)],
      ["aboutMe", "About me", hasText(data.aboutMe)],
      ["languages", "At least one language", hasItems(data.languages)],
      ["consultationMode", "At least one consultation mode", hasItems(data.consultationMode)],
      ["certifications", "Certification with uploaded document", Array.isArray(data.certifications) && data.certifications.some((cert) => hasText(cert?.name) && (hasText(cert?.documentUrl) || hasText(cert?.documentPublicId)))],
    );
  }
  const fields = checks.map(([key, label, complete]) => ({ key, label, complete: Boolean(complete) }));
  const completedFields = fields.filter((field) => field.complete).length;
  const isComplete = completedFields === fields.length;
  return {
    percentage: isComplete ? 100 : Math.floor(completedFields * 100 / fields.length),
    completedFields,
    totalFields: fields.length,
    isComplete,
    missingFields: fields.filter((field) => !field.complete),
    fields,
  };
};

export const isProfessionalProfileComplete = (data) =>
  isProfessionalRole(data?.role) && getProfileCompletion(data).isComplete;

export const getAgeFromDateOfBirth = (value) => {
  if (!value) return { date: null, age: null, valid: true };
  if (value instanceof Date && Number.isNaN(value.getTime())) return { date: null, age: null, valid: false };

  const raw = value instanceof Date ? value.toISOString() : String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return { date: null, age: null, valid: false };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { date: null, age: null, valid: false };
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  ));
  if (date > todayUtc) return { date: null, age: null, valid: false };

  let age = todayUtc.getUTCFullYear() - year;
  const birthdayThisYear = new Date(Date.UTC(todayUtc.getUTCFullYear(), month - 1, day));
  if (todayUtc < birthdayThisYear) age -= 1;

  return { date, age, valid: age >= 0 };
};
const DEFAULT_PHONE_COUNTRY_CODE = "91";
const LOCAL_PHONE_NUMBER_LENGTHS_BY_COUNTRY_CODE = {
  "1": [10], "7": [10], "20": [10], "27": [9], "30": [10], "31": [9],
  "32": [9], "33": [9], "34": [9], "36": [9], "39": [9, 10], "40": [9],
  "41": [9], "43": [10, 11, 12, 13], "44": [10], "45": [8], "46": [9],
  "47": [8], "48": [9], "49": [10, 11], "51": [9], "52": [10],
  "53": [8], "54": [10], "55": [10, 11], "56": [9], "57": [10],
  "58": [10], "60": [9, 10], "61": [9], "62": [9, 10, 11, 12],
  "63": [10], "64": [8, 9, 10], "65": [8], "66": [9], "81": [10],
  "82": [9, 10], "84": [9], "86": [11], "90": [10], "91": [10],
  "92": [10], "93": [9], "94": [9], "95": [8, 9, 10], "98": [10],
  "211": [9], "212": [9], "213": [9], "216": [8], "218": [9],
  "220": [7], "221": [9], "222": [8], "223": [8], "224": [9],
  "225": [10], "226": [8], "227": [8], "228": [8], "229": [8],
  "230": [8], "231": [7, 8], "232": [8], "233": [9], "234": [10],
  "235": [8], "236": [8], "237": [9], "238": [7], "239": [7],
  "240": [9], "241": [8], "242": [9], "243": [9], "244": [9],
  "245": [7], "248": [7], "249": [9], "250": [9], "251": [9],
  "252": [8, 9], "253": [8], "254": [9], "255": [9], "256": [9],
  "257": [8], "258": [9], "260": [9], "261": [9], "262": [9],
  "263": [9], "264": [9], "265": [9], "266": [8], "267": [7, 8],
  "268": [8], "269": [7], "290": [4], "291": [7], "297": [7],
  "298": [6], "299": [6], "350": [8], "351": [9], "352": [9],
  "353": [9], "354": [7], "355": [8, 9], "356": [8], "357": [8],
  "358": [9, 10], "359": [8, 9], "370": [8], "371": [8], "372": [7, 8],
  "373": [8], "374": [8], "375": [9], "376": [6], "377": [8, 9],
  "378": [10], "379": [10], "380": [9], "381": [8, 9], "382": [8],
  "383": [8], "385": [8, 9], "386": [8], "387": [8], "389": [8],
  "420": [9], "421": [9], "423": [7], "500": [5], "501": [7],
  "502": [8], "503": [8], "504": [8], "505": [8], "506": [8],
  "507": [8], "508": [6], "509": [8], "590": [9], "591": [8],
  "592": [7], "593": [9], "594": [9], "595": [9], "596": [9],
  "597": [7], "598": [8], "599": [7], "670": [7, 8], "672": [6],
  "673": [7], "674": [7], "675": [8], "676": [5, 7], "677": [5, 7],
  "678": [5, 7], "679": [7], "680": [7], "681": [6], "682": [5],
  "683": [4], "685": [5, 7], "686": [5, 8], "687": [6], "688": [5],
  "689": [6], "690": [4], "691": [7], "692": [7], "850": [10],
  "852": [8], "853": [8], "855": [8, 9], "856": [8, 10], "880": [10],
  "886": [9], "960": [7], "961": [8], "962": [9], "963": [9],
  "964": [10], "965": [8], "966": [9], "967": [9], "968": [8],
  "970": [9], "971": [9], "972": [9], "973": [8], "974": [8],
  "975": [8], "976": [8], "977": [10], "992": [9], "993": [8],
  "994": [9], "995": [9], "996": [9], "998": [9],
  "1242": [10], "1246": [10], "1264": [10], "1268": [10],
  "1284": [10], "1340": [10], "1345": [10], "1441": [10],
  "1473": [10], "1649": [10], "1664": [10], "1670": [10],
  "1671": [10], "1684": [10], "1721": [10], "1758": [10],
  "1767": [10], "1784": [10], "1787": [10], "1809": [10],
  "1829": [10], "1849": [10], "1868": [10], "1876": [10],
  "1869": [10], "1939": [10], "441481": [6], "441534": [10],
  "441624": [10],
};

const getLocalPhoneLengths = (countryCode = DEFAULT_PHONE_COUNTRY_CODE) => {
  const countryDigits =
    String(countryCode || DEFAULT_PHONE_COUNTRY_CODE).replace(/\D/g, "") ||
    DEFAULT_PHONE_COUNTRY_CODE;
  return (
    LOCAL_PHONE_NUMBER_LENGTHS_BY_COUNTRY_CODE[countryDigits] ||
    [Math.max(4, 15 - countryDigits.length)]
  );
};

const getLocalPhoneMaxLength = (countryCode = DEFAULT_PHONE_COUNTRY_CODE) =>
  Math.max(...getLocalPhoneLengths(countryCode));

export const normalizePhoneNumber = (value = "", fallbackCountryCode = DEFAULT_PHONE_COUNTRY_CODE, strict = false) => {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  const fallbackDigits = String(fallbackCountryCode || DEFAULT_PHONE_COUNTRY_CODE).replace(/\D/g, "") || DEFAULT_PHONE_COUNTRY_CODE;
  const countryCode = `+${fallbackDigits}`;
  const allowedLengths = getLocalPhoneLengths(fallbackDigits);
  const maxLocalLength = getLocalPhoneMaxLength(fallbackDigits);

  if (!digits) {
    return {
      digits: "",
      formatted: "",
      smsFormatted: "",
      countryCode,
      isValid: false,
      duplicateValues: [],
    };
  }

  let localDigits = digits;
  if (localDigits.length > maxLocalLength) {
    const prefixes = Array.from(
      new Set([fallbackDigits, DEFAULT_PHONE_COUNTRY_CODE].filter(Boolean)),
    );
    const matchingPrefix = prefixes.find(
      (prefix) =>
        localDigits.startsWith(prefix) &&
        localDigits.length - prefix.length <= maxLocalLength,
    );
    if (matchingPrefix) {
      localDigits = localDigits.slice(matchingPrefix.length);
    }
  }
  if (!strict) localDigits = localDigits.slice(0, maxLocalLength);

  const formatted = localDigits;
  const smsFormatted = `+${fallbackDigits}${localDigits}`;
  const duplicateValues = Array.from(
    new Set([
      formatted,
      smsFormatted,
      `${fallbackDigits}${localDigits}`,
      `+${DEFAULT_PHONE_COUNTRY_CODE}${localDigits}`,
      `${DEFAULT_PHONE_COUNTRY_CODE}${localDigits}`,
      digits,
    ].filter(Boolean)),
  );

  return {
    digits: localDigits,
    formatted,
    smsFormatted,
    countryCode,
    isValid: allowedLengths.includes(localDigits.length),
    duplicateValues,
  };
};

