export interface config {
    'episode-folder': string,
    'page-folder': string,
    'transcript-folder': string,
    defaults: {
        interviewer: Array<string>;
    }
}

export interface episode {
    spotifyAudioUrl: string,
    interviewee: Array<string>
}
