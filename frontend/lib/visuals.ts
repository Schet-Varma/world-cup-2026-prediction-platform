export const teamFlags: Record<string, string> = {
  arg: "🇦🇷",
  fra: "🇫🇷",
  esp: "🇪🇸",
  bra: "🇧🇷",
  eng: "🏴",
  ned: "🇳🇱",
  por: "🇵🇹",
  ger: "🇩🇪",
  bel: "🇧🇪",
  ita: "🇮🇹",
  uru: "🇺🇾",
  cro: "🇭🇷",
  col: "🇨🇴",
  usa: "🇺🇸",
  mex: "🇲🇽",
  mar: "🇲🇦",
  jpn: "🇯🇵",
  sui: "🇨🇭",
  den: "🇩🇰",
  sen: "🇸🇳",
  kor: "🇰🇷",
  ecu: "🇪🇨",
  aut: "🇦🇹",
  aus: "🇦🇺",
  can: "🇨🇦",
  pol: "🇵🇱",
  ser: "🇷🇸",
  nga: "🇳🇬",
  irl: "🇮🇪",
  qat: "🇶🇦",
  rsa: "🇿🇦",
  jam: "🇯🇲",
  cze: "🇨🇿",
  bih: "🇧🇦",
  hai: "🇭🇹",
  sco: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  gha: "🇬🇭",
  pan: "🇵🇦",
  swe: "🇸🇪",
  tun: "🇹🇳"
};

export const teamNameToId: Record<string, string> = {
  Argentina: "arg",
  France: "fra",
  Spain: "esp",
  Brazil: "bra",
  England: "eng",
  Netherlands: "ned",
  Portugal: "por",
  Germany: "ger",
  Belgium: "bel",
  Italy: "ita",
  Uruguay: "uru",
  Croatia: "cro",
  Colombia: "col",
  "United States": "usa",
  Mexico: "mex",
  Morocco: "mar",
  Japan: "jpn",
  Switzerland: "sui",
  Denmark: "den",
  Senegal: "sen",
  "South Korea": "kor",
  Ecuador: "ecu",
  Austria: "aut",
  Australia: "aus",
  Canada: "can",
  Poland: "pol",
  Serbia: "ser",
  Nigeria: "nga",
  Ireland: "irl",
  Qatar: "qat",
  "South Africa": "rsa",
  Jamaica: "jam",
  Czechia: "cze",
  "Bosnia and Herzegovina": "bih",
  Haiti: "hai",
  Scotland: "sco",
  Ghana: "gha",
  Panama: "pan",
  Sweden: "swe",
  Tunisia: "tun"
};

export function flagForTeamId(teamId?: string | null): string {
  if (!teamId) {
    return "⚽";
  }
  return teamFlags[teamId] ?? "⚽";
}

export function flagForTeamName(teamName?: string | null): string {
  if (!teamName) {
    return "⚽";
  }
  return flagForTeamId(teamNameToId[teamName]);
}
