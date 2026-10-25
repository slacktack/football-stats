export function teamCrest(id: string | number, small = false) {
  return `https://images.fotmob.com/image_resources/logo/teamlogo/${id}${small ? "_small" : ""}.png`;
}

export function leagueLogo(id: string | number) {
  return `https://images.fotmob.com/image_resources/logo/leaguelogo/${id}.png`;
}

export function playerImage(id: string | number) {
  return `https://images.fotmob.com/image_resources/playerimages/${id}.png`;
}
