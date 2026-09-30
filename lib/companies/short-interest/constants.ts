export const FI_ORIGIN = "https://www.fi.se";

export const FI_SHORT_INTEREST_PAGE_URL =
  "https://www.fi.se/sv/vara-register/blankningsregistret/";

export const FI_AGGREGATE_ODS_URL =
  "https://www.fi.se/BlankningsRegister/GetBlankningsregisterAggregat";

export const FI_CURRENT_POSITIONS_ODS_URL =
  "https://www.fi.se/BlankningsRegister/GetAktuellFile";

export const FI_SHORT_INTEREST_PUBLISHER = "Finansinspektionen" as const;

/** Reported net short positions above this share of issued capital are in the aggregate. */
export const FI_AGGREGATE_REPORTING_THRESHOLD_PERCENT = 0.1;

/** Named holder positions are public once they have passed this share of issued capital. */
export const FI_NAMED_POSITION_THRESHOLD_PERCENT = 0.5;

export const FI_SHORT_INTEREST_REVALIDATE_SECONDS = 60 * 60;

export const FI_SHORT_INTEREST_TIMEOUT_MS = 8_000;

/** Current official ODS files are about 600 KB, including an embedded logo. */
export const FI_SHORT_INTEREST_MAX_BYTES = 3_000_000;

export const FI_ODS_CONTENT_TYPE = "application/vnd.oasis.opendocument.spreadsheet";

export const FI_ODS_CONTENT_XML_MAX_BYTES = 4_000_000;

export const FI_SHORT_INTEREST_MAX_ROWS = 5_000;
