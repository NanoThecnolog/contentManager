export type DriveSeries = {
    title: string
    subtitle: string
    tmdbId: number
    episodes: DriveEpisodes[]
    count: number
}

export type DriveEpisodes = {
    season: number,
    episode: number,
    src: string
}